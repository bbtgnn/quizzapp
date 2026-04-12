import type { Attempt, Question, Student } from '$lib/model/types.js';
import { createRng, hashStringToSeed, pickRandom, shuffleInPlace } from './seeded-random.js';

export interface ComputeSessionPlanInput {
	sessionId: string;
	startedAt: number;
	nQuestionsPerStudent: number;
	/** Every student_id enrolled in the session (including completed if still present). */
	enrolledStudentIds: string[];
	students: Student[];
	questionPool: Question[];
	/** Prior attempts for tiering (any session); merged with session attempts by caller if needed. */
	attemptsForTiering: Attempt[];
}

export interface ComputeSessionPlanResult {
	studentOrderIds: string[];
	questionSchedule: Record<string, string[]>;
}

function mostRecentAttemptPerQuestion(attempts: Attempt[], studentId: string): Map<string, Attempt> {
	const map = new Map<string, Attempt>();
	for (const a of attempts) {
		if (a.student_id !== studentId) continue;
		const prev = map.get(a.question_id);
		if (prev === undefined || a.answered_at > prev.answered_at) {
			map.set(a.question_id, a);
		}
	}
	return map;
}

function tierCandidates(
	pool: Question[],
	recentByQ: Map<string, Attempt>
): { tier1: Question[]; tier2: Question[]; tier3: Question[] } {
	const tier1: Question[] = [];
	const partial: Question[] = [];
	const success: Question[] = [];

	for (const q of pool) {
		const recent = recentByQ.get(q.id);
		if (recent === undefined || recent.outcome === 'wrong') {
			tier1.push(q);
		} else if (recent.outcome === 'partial') {
			partial.push(q);
		} else {
			success.push(q);
		}
	}

	partial.sort(
		(a, b) =>
			(recentByQ.get(a.id)!.answered_at ?? 0) - (recentByQ.get(b.id)!.answered_at ?? 0)
	);
	success.sort(
		(a, b) =>
			(recentByQ.get(a.id)!.answered_at ?? 0) - (recentByQ.get(b.id)!.answered_at ?? 0)
	);

	return { tier1, tier2: partial, tier3: success };
}

function pickQuestionForSlot(
	pool: Question[],
	recentByQ: Map<string, Attempt>,
	alreadyAssignedToStudent: Set<string>,
	blockedGlobally: Set<string>,
	rand: () => number
): Question {
	const { tier1, tier2, tier3 } = tierCandidates(pool, recentByQ);

	const tryPick = (relaxGlobal: boolean, relaxSelf: boolean): Question | null => {
		const selfBlock = relaxSelf ? new Set<string>() : alreadyAssignedToStudent;
		const globalBlock = relaxGlobal ? new Set<string>() : blockedGlobally;

		const filterTier = (qs: Question[]) =>
			qs.filter((q) => !selfBlock.has(q.id) && !globalBlock.has(q.id));

		let c1 = filterTier(tier1);
		if (c1.length > 0) return pickRandom(c1, rand);
		let c2 = filterTier(tier2);
		if (c2.length > 0) return pickRandom(c2, rand);
		let c3 = filterTier(tier3);
		if (c3.length > 0) return pickRandom(c3, rand);

		c1 = tier1.filter((q) => !selfBlock.has(q.id));
		if (c1.length > 0) return pickRandom(c1, rand);
		c2 = tier2.filter((q) => !selfBlock.has(q.id));
		if (c2.length > 0) return pickRandom(c2, rand);
		c3 = tier3.filter((q) => !selfBlock.has(q.id));
		if (c3.length > 0) return pickRandom(c3, rand);

		if (!relaxSelf) return tryPick(relaxGlobal, true);

		const all = pool.filter((q) => !globalBlock.has(q.id));
		if (all.length > 0) return pickRandom(all, rand);
		return null;
	};

	const picked =
		tryPick(false, false) ??
		tryPick(true, false) ??
		tryPick(true, true) ??
		pickRandom(pool, rand);
	return picked;
}

/**
 * Builds a fixed student order and per-student question schedule at session start.
 * Adjacent students in turn order avoid sharing the same question at the same slot index
 * (and the previous student's prior slot) when the pool allows it.
 */
export function computeSessionPlan(input: ComputeSessionPlanInput): ComputeSessionPlanResult {
	const {
		sessionId,
		startedAt,
		nQuestionsPerStudent,
		enrolledStudentIds,
		students,
		questionPool,
		attemptsForTiering
	} = input;

	if (questionPool.length === 0) {
		throw new Error('computeSessionPlan: question pool is empty');
	}

	const studentById = new Map(students.map((s) => [s.id, s]));
	const orderedIds = enrolledStudentIds.filter((id) => studentById.has(id));
	const base = [...orderedIds].sort((a, b) => a.localeCompare(b));

	const orderRng = createRng(hashStringToSeed(`${sessionId}:order:${startedAt}`) ^ startedAt);
	const studentOrderIds = [...base];
	shuffleInPlace(studentOrderIds, orderRng);

	const pickRng = createRng(hashStringToSeed(`${sessionId}:questions:${startedAt}`) ^ (startedAt * 31));

	const questionSchedule: Record<string, string[]> = {};
	let prevStudentSchedule: string[] | null = null;

	for (let i = 0; i < studentOrderIds.length; i++) {
		const sid = studentOrderIds[i]!;
		const recentByQ = mostRecentAttemptPerQuestion(attemptsForTiering, sid);
		const assigned: string[] = [];
		const assignedSet = new Set<string>();

		for (let slot = 0; slot < nQuestionsPerStudent; slot++) {
			const blocked = new Set<string>();
			if (prevStudentSchedule) {
				const sameSlot = prevStudentSchedule[slot];
				if (sameSlot) blocked.add(sameSlot);
				if (slot > 0) {
					const prevSlot = prevStudentSchedule[slot - 1];
					if (prevSlot) blocked.add(prevSlot);
				}
			}

			const q = pickQuestionForSlot(questionPool, recentByQ, assignedSet, blocked, pickRng);
			assigned.push(q.id);
			assignedSet.add(q.id);
		}

		questionSchedule[sid] = assigned;
		prevStudentSchedule = assigned;
	}

	return { studentOrderIds, questionSchedule };
}
