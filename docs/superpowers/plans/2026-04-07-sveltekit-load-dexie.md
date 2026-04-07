# SvelteKit `load` for Dexie routes — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move IndexedDB reads into universal `+page.ts` loaders for every Dexie-backed list/detail route in the spec, wire `+page.svelte` to `data`, use `invalidateAll()` after mutations, and move Settings’ direct `db` usage into a library module.

**Architecture:** One `+page.ts` per route that currently reads in `onMount` (or that needs initial data). Optional extracted helpers under `src/lib/data/loaders/` when tests or duplication require it. Root layout stays `ssr = false`. Use `error(404)` / `error(500)` from `@sveltejs/kit` where the spec calls for hard failures; keep the existing soft load error on `/sessions/new` as a documented exception.

**Tech stack:** SvelteKit 2, Svelte 5, TypeScript, Dexie 4, Vitest (node project + browser project), Playwright, bun.

---

## File map (create / modify)

| Path | Role |
|------|------|
| `src/lib/data/loaders/classrooms-index.ts` | Pure async helper for home page classroom list + counts (TDD target). |
| `src/lib/data/loaders/classrooms-index.test.ts` | Vitest mocks for `listClassrooms` / `listStudentsByClassroom`. |
| `src/routes/+page.ts` | `load` → `{ classrooms }`. |
| `src/routes/+page.svelte` | `data` prop; remove `onMount` fetch; `invalidateAll` after delete. |
| `src/routes/sessions/+page.ts` | Paused sessions enrichment + `completedSessionsCount`. |
| `src/routes/sessions/+page.svelte` | Consume `data`; drop local `loadData` / `onMount`. |
| `src/routes/sessions/new/+page.ts` | `classrooms` + `questionSets`; soft `loadError` on failure. |
| `src/routes/sessions/new/+page.svelte` | Consume `data`; clear `loadError` handling duplication with load. |
| `src/routes/sessions/[id]/run/+page.ts` | Fetch everything `SessionEngine` needs; `error(404)` if missing `id` or session. |
| `src/routes/sessions/[id]/run/+page.svelte` | Build `SessionEngine` from `data` (e.g. `$effect` or `onMount`); remove inline Dexie reads. |
| `src/routes/history/+page.ts` | Completed sessions with classroom + attempt stats. |
| `src/routes/history/+page.svelte` | Consume `data`. |
| `src/routes/history/[id]/+page.ts` | Session + grouped attempts; `error(404)` if missing session. |
| `src/routes/history/[id]/+page.svelte` | Consume `data`; remove `notFound` branch (Kit error page handles 404). |
| `src/routes/question-sets/+page.ts` | Question sets with snippet/question counts. |
| `src/routes/question-sets/+page.svelte` | Consume `data`; `invalidateAll` after delete. |
| `src/routes/classrooms/[id]/+page.ts` | Classroom + students; `error(404)` if missing. |
| `src/routes/classrooms/[id]/+page.svelte` | Consume `data`; `invalidateAll` after add/remove/update name/delete classroom where reload should match DB. |
| `src/lib/db/backup.ts` | `exportFullBackup`, `importFullBackupFromFile` — sole module that imports `db` for backup (called from Settings UI). |
| `src/routes/settings/+page.svelte` | Replace `db` import with `$lib/db/backup.js`. |
| `src/routes/+error.svelte` (optional but recommended) | Friendly message for `error(404)` / `error(500)` from loads. |

**No new `+page.ts`:** `src/routes/question-sets/import/+page.svelte` (no initial DB read), `src/routes/classrooms/new/+page.svelte` (writes only), `src/routes/settings/+page.svelte` (no initial read; only user-triggered backup).

---

### Task 1: Classrooms index — TDD loader + `+page.ts` + home page

**Files:**

- Create: `src/lib/data/loaders/classrooms-index.ts`
- Create: `src/lib/data/loaders/classrooms-index.test.ts`
- Create: `src/routes/+page.ts`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Write the failing test**

Create `src/lib/data/loaders/classrooms-index.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Classroom } from '$lib/db/types.js';
import { loadClassroomsIndex } from './classrooms-index.js';

vi.mock('$lib/db/index.js', () => ({
	listClassrooms: vi.fn(),
	listStudentsByClassroom: vi.fn()
}));

import { listClassrooms, listStudentsByClassroom } from '$lib/db/index.js';

describe('loadClassroomsIndex', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns classrooms sorted by created_at descending with studentCount', async () => {
		const a: Classroom = { id: 'a', name: 'Old', created_at: 100 };
		const b: Classroom = { id: 'b', name: 'New', created_at: 200 };
		vi.mocked(listClassrooms).mockResolvedValue([a, b]);
		vi.mocked(listStudentsByClassroom).mockImplementation(async (classroomId: string) =>
			classroomId === 'a' ? [{ id: 's1', classroom_id: 'a', name: 'x' }] : []
		);

		const { classrooms } = await loadClassroomsIndex();

		expect(classrooms).toHaveLength(2);
		expect(classrooms[0].id).toBe('b');
		expect(classrooms[1].id).toBe('a');
		expect(classrooms[1].studentCount).toBe(1);
		expect(classrooms[0].studentCount).toBe(0);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
bun run test:unit -- --run --project server src/lib/data/loaders/classrooms-index.test.ts
```

Expected: FAIL (module `./classrooms-index.js` not found or export missing).

- [ ] **Step 3: Implement loader**

Create `src/lib/data/loaders/classrooms-index.ts`:

```ts
import { listClassrooms, listStudentsByClassroom } from '$lib/db/index.js';
import type { Classroom } from '$lib/db/types.js';

export type ClassroomWithCount = Classroom & { studentCount: number };

export async function loadClassroomsIndex(): Promise<{ classrooms: ClassroomWithCount[] }> {
	const dbClassrooms = await listClassrooms();
	const withCounts = await Promise.all(
		dbClassrooms.map(async (c) => {
			const students = await listStudentsByClassroom(c.id);
			return { ...c, studentCount: students.length };
		})
	);
	const classrooms = withCounts.sort((a, b) => b.created_at - a.created_at);
	return { classrooms };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
bun run test:unit -- --run --project server src/lib/data/loaders/classrooms-index.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add `src/routes/+page.ts`**

Create `src/routes/+page.ts`:

```ts
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { loadClassroomsIndex } from '$lib/data/loaders/classrooms-index.js';

export const load: PageLoad = async () => {
	try {
		return await loadClassroomsIndex();
	} catch (e) {
		console.error('Failed to load classrooms:', e);
		throw error(500, { message: 'Could not load classrooms.' });
	}
};
```

Run:

```bash
bunx svelte-kit sync
bun run check
```

Expected: `check` passes (or only pre-existing issues).

- [ ] **Step 6: Refactor `src/routes/+page.svelte`**

- Add `import { invalidateAll } from '$app/navigation';`
- Replace `onMount` + local `classrooms` / `loading` initial fetch with:

```ts
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
```

- Bind the list to `data.classrooms` — because `data` updates on invalidation, use `$derived(data.classrooms)` or reference `data.classrooms` in the template directly (reactive when `data` changes).
- Remove the full-page loading spinner for **initial** load (Kit waits for `load` before rendering this page). Keep **`deleting` / `isDeleting`** local state around `handleDelete` if you want a button spinner; after `await deleteClassroom(id)` call `await invalidateAll()`.
- Remove unused `onMount` import.

- [ ] **Step 7: Commit**

```bash
git add src/lib/data/loaders/classrooms-index.ts src/lib/data/loaders/classrooms-index.test.ts src/routes/+page.ts src/routes/+page.svelte
git commit -m "feat: load classrooms index via +page.ts"
```

---

### Task 2: Sessions list (`/sessions`)

**Files:**

- Create: `src/routes/sessions/+page.ts`
- Modify: `src/routes/sessions/+page.svelte`

- [ ] **Step 1: Add `src/routes/sessions/+page.ts`**

```ts
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { listSessions, getClassroom, listSessionStudents } from '$lib/db/index.js';
import type { Session } from '$lib/db/types.js';

export type PausedSessionView = Session & {
	classroomName: string;
	totalStudents: number;
	completedStudents: number;
};

export const load: PageLoad = async () => {
	try {
		const allSessions = await listSessions();
		const paused = allSessions.filter((s) => s.status === 'paused');
		const completedSessionsCount = allSessions.filter((s) => s.status === 'completed').length;

		const enrichedPaused: PausedSessionView[] = await Promise.all(
			paused.map(async (session) => {
				const classroom = await getClassroom(session.classroom_id);
				const students = await listSessionStudents(session.id);
				const completedStudents = students.filter((s) => s.completed).length;
				return {
					...session,
					classroomName: classroom ? classroom.name : 'Unknown Classroom',
					totalStudents: students.length,
					completedStudents
				};
			})
		);

		enrichedPaused.sort((a, b) => b.started_at - a.started_at);

		return { pausedSessions: enrichedPaused, completedSessionsCount };
	} catch (e) {
		console.error('Failed to load sessions:', e);
		throw error(500, { message: 'Could not load sessions.' });
	}
};
```

- [ ] **Step 2: Update `src/routes/sessions/+page.svelte`**

Use `PageProps` from `./$types`, `let { data } = $props()`, template uses `data.pausedSessions` and `data.completedSessionsCount`. Remove `onMount`, `loadData`, and initial `loading` / `loading` spinner block for first paint.

- [ ] **Step 3: Verify**

```bash
bun run check
bun run test:unit -- --run --project server
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/sessions/+page.ts src/routes/sessions/+page.svelte
git commit -m "feat: load sessions list via +page.ts"
```

---

### Task 3: New session (`/sessions/new`) — soft load error

**Files:**

- Create: `src/routes/sessions/new/+page.ts`
- Modify: `src/routes/sessions/new/+page.svelte`

- [ ] **Step 1: Add `src/routes/sessions/new/+page.ts`**

```ts
import type { PageLoad } from './$types';
import { listClassrooms, listQuestionSets } from '$lib/db/index.js';

export const load: PageLoad = async () => {
	try {
		const [dbClassrooms, dbQuestionSets] = await Promise.all([
			listClassrooms(),
			listQuestionSets()
		]);
		return {
			classrooms: dbClassrooms.sort((a, b) => b.created_at - a.created_at),
			questionSets: dbQuestionSets.sort((a, b) => b.imported_at - a.imported_at),
			loadError: null as string | null
		};
	} catch (e) {
		console.error('Failed to load data:', e);
		return {
			classrooms: [],
			questionSets: [],
			loadError: 'Failed to load classrooms and question sets.'
		};
	}
};
```

- [ ] **Step 2: Update `src/routes/sessions/new/+page.svelte`**

- `let { data } = $props()` from `./$types`.
- Initialize form state from `data`; use `data.classrooms`, `data.questionSets`.
- If `data.loadError`, show the existing red banner (same copy).
- Remove `onMount` / `loadData` / initial `loading` spinner; use `data.classrooms.length === 0` etc. for empty states (same branches as today).
- Keep `handleSubmit` mutations; no `invalidateAll` needed before `goto` to run page.

- [ ] **Step 3: Commit**

```bash
git add src/routes/sessions/new/+page.ts src/routes/sessions/new/+page.svelte
git commit -m "feat: load new-session form via +page.ts"
```

---

### Task 4: History list (`/history`)

**Files:**

- Create: `src/routes/history/+page.ts`
- Modify: `src/routes/history/+page.svelte`

- [ ] **Step 1: Add `src/routes/history/+page.ts`**

```ts
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { listSessions, getClassroom, listAttemptsBySession } from '$lib/db/index.js';
import type { Session } from '$lib/db/types.js';

export type SessionWithDetails = Session & {
	classroomName: string;
	studentCount: number;
	attemptCount: number;
};

export const load: PageLoad = async () => {
	try {
		const allSessions = await listSessions();
		const completedSessions = allSessions.filter((s) => s.status === 'completed');

		const withDetails: SessionWithDetails[] = await Promise.all(
			completedSessions.map(async (s) => {
				const classroom = await getClassroom(s.classroom_id);
				const attempts = await listAttemptsBySession(s.id);
				const uniqueStudents = new Set(attempts.map((a) => a.student_id));
				return {
					...s,
					classroomName: classroom?.name || 'Unknown Classroom',
					studentCount: uniqueStudents.size,
					attemptCount: attempts.length
				};
			})
		);

		withDetails.sort((a, b) => (b.completed_at || 0) - (a.completed_at || 0));
		return { sessions: withDetails };
	} catch (e) {
		console.error('Failed to load sessions:', e);
		throw error(500, { message: 'Could not load history.' });
	}
};
```

- [ ] **Step 2: Update `src/routes/history/+page.svelte`** — `data.sessions`, remove `onMount` / `loading`.

- [ ] **Step 3: Commit** — `feat: load history list via +page.ts`

---

### Task 5: History detail (`/history/[id]`)

**Files:**

- Create: `src/routes/history/[id]/+page.ts`
- Modify: `src/routes/history/[id]/+page.svelte`

- [ ] **Step 1: Add `src/routes/history/[id]/+page.ts`**

```ts
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import {
	getSession,
	listAttemptsBySession,
	listStudentsByClassroom,
	listQuestionsByQuestionSet
} from '$lib/db/index.js';
import type { Attempt, Question, Student } from '$lib/db/types.js';

export type AttemptWithDetails = Attempt & { questionText: string };
export type StudentWithAttempts = Student & { attempts: AttemptWithDetails[] };

export const load: PageLoad = async ({ params }) => {
	const sessionId = params.id;
	if (!sessionId) throw error(404, { message: 'Session not found' });

	try {
		const loadedSession = await getSession(sessionId);
		if (!loadedSession) throw error(404, { message: 'Session not found' });

		const [attempts, students] = await Promise.all([
			listAttemptsBySession(sessionId),
			listStudentsByClassroom(loadedSession.classroom_id)
		]);

		const questionsMap = new Map<string, Question>();
		for (const qsId of loadedSession.question_set_ids) {
			const qsQuestions = await listQuestionsByQuestionSet(qsId);
			for (const q of qsQuestions) questionsMap.set(q.id, q);
		}

		const grouped: StudentWithAttempts[] = students
			.map((student) => {
				const studentAttempts = attempts
					.filter((a) => a.student_id === student.id)
					.map((a) => ({
						...a,
						questionText: questionsMap.get(a.question_id)?.text || 'Unknown Question'
					}))
					.sort((a, b) => a.answered_at - b.answered_at);
				return { ...student, attempts: studentAttempts };
			})
			.filter((s) => s.attempts.length > 0);

		return { session: loadedSession, studentsWithAttempts: grouped };
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 404) {
			throw e;
		}
		console.error('Failed to load session details:', e);
		throw error(500, { message: 'Could not load session details.' });
	}
};
```

- [ ] **Step 2: Update `src/routes/history/[id]/+page.svelte`**

- `let { data } = $props()` — use `data.session`, `data.studentsWithAttempts`.
- Remove `page.params`, `onMount`, `notFound`, `loading` blocks tied to old fetch.

- [ ] **Step 3: Commit** — `feat: load history detail via +page.ts`

---

### Task 6: Question sets list (`/question-sets`)

**Files:**

- Create: `src/routes/question-sets/+page.ts`
- Modify: `src/routes/question-sets/+page.svelte`

- [ ] **Step 1: Add `src/routes/question-sets/+page.ts`**

```ts
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import {
	listQuestionSets,
	listSnippetsByQuestionSet,
	listQuestionsByQuestionSet
} from '$lib/db/index.js';
import type { QuestionSet } from '$lib/db/types.js';

export type QuestionSetWithCounts = QuestionSet & { snippetCount: number; questionCount: number };

export const load: PageLoad = async () => {
	try {
		const dbQuestionSets = await listQuestionSets();
		const withCounts: QuestionSetWithCounts[] = await Promise.all(
			dbQuestionSets.map(async (qs) => {
				const [snippets, questions] = await Promise.all([
					listSnippetsByQuestionSet(qs.id),
					listQuestionsByQuestionSet(qs.id)
				]);
				return { ...qs, snippetCount: snippets.length, questionCount: questions.length };
			})
		);
		withCounts.sort((a, b) => b.imported_at - a.imported_at);
		return { questionSets: withCounts };
	} catch (e) {
		console.error('Failed to load question sets:', e);
		throw error(500, { message: 'Could not load question sets.' });
	}
};
```

- [ ] **Step 2: Update `src/routes/question-sets/+page.svelte`**

- `invalidateAll` after `deleteQuestionSet` instead of `loadQuestionSets()`.

- [ ] **Step 3: Commit** — `feat: load question sets via +page.ts`

---

### Task 7: Edit classroom (`/classrooms/[id]`)

**Files:**

- Create: `src/routes/classrooms/[id]/+page.ts`
- Modify: `src/routes/classrooms/[id]/+page.svelte`

- [ ] **Step 1: Add `src/routes/classrooms/[id]/+page.ts`**

```ts
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getClassroom, listStudentsByClassroom } from '$lib/db/index.js';

export const load: PageLoad = async ({ params }) => {
	const id = params.id;
	if (!id) throw error(404, { message: 'Classroom not found' });

	try {
		const classroom = await getClassroom(id);
		if (!classroom) throw error(404, { message: 'Classroom not found' });
		const students = await listStudentsByClassroom(id);
		return { classroom, students };
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 404) {
			throw e;
		}
		console.error('Failed to load classroom:', e);
		throw error(500, { message: 'Could not load classroom.' });
	}
};
```

- [ ] **Step 2: Update `src/routes/classrooms/[id]/+page.svelte`**

- `let { data } = $props()`; sync editable `classroom` from `data.classroom` (use `$state` + `$effect` to copy when `data.classroom` changes after `invalidateAll`, or bind form fields to `data.classroom` directly if you do not need a separate mutable copy — prefer **`$state(structuredClone(data.classroom))` in `$effect.pre`** when `data.classroom.id` changes** to keep “edit name” UX).
- For **add/remove student** and **update name**: after successful mutation, `await invalidateAll()` so `load` refreshes `students` / `classroom` (remove purely local `students = …` list mutation **or** keep optimistic updates but then still call `invalidateAll` for consistency — spec default is invalidation; simplest is **invalidateAll** after each successful mutation).
- Remove `page.params`-based `loadData` / `onMount`.
- **404:** remove the big “Classroom not found” inline block; `error(404)` from load shows Kit error UI (see Task 10).

- [ ] **Step 3: Commit** — `feat: load classroom editor via +page.ts`

---

### Task 8: Run session (`/sessions/[id]/run`)

**Files:**

- Create: `src/routes/sessions/[id]/run/+page.ts`
- Modify: `src/routes/sessions/[id]/run/+page.svelte`

- [ ] **Step 1: Add `src/routes/sessions/[id]/run/+page.ts`**

```ts
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import {
	getSession,
	listSessionStudents,
	listStudentsByClassroom,
	listSnippetsByQuestionSet,
	listQuestionsBySnippet,
	listAttemptsBySession
} from '$lib/db/index.js';
import type { Question, Snippet } from '$lib/db/types.js';

export const load: PageLoad = async ({ params }) => {
	const sessionId = params.id;
	if (!sessionId) throw error(404, { message: 'Session not found' });

	try {
		const session = await getSession(sessionId);
		if (!session) throw error(404, { message: 'Session not found' });

		const [sessionStudents, students, attempts] = await Promise.all([
			listSessionStudents(sessionId),
			listStudentsByClassroom(session.classroom_id),
			listAttemptsBySession(sessionId)
		]);

		const snippetByQuestionId: Record<string, Snippet> = {};
		const allQuestions: Question[] = [];

		for (const qsId of session.question_set_ids) {
			const snippets = await listSnippetsByQuestionSet(qsId);
			for (const snippet of snippets) {
				const qs = await listQuestionsBySnippet(snippet.id);
				for (const q of qs) {
					snippetByQuestionId[q.id] = snippet;
				}
				allQuestions.push(...qs);
			}
		}

		return { session, sessionStudents, students, allQuestions, attempts, snippetByQuestionId };
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 404) {
			throw e;
		}
		console.error('Failed to load session run data:', e);
		throw error(500, { message: 'Could not load session.' });
	}
};
```

- [ ] **Step 2: Update `src/routes/sessions/[id]/run/+page.svelte`**

- Import `PageProps` from `./$types`, `let { data } = $props()`.
- Remove Dexie imports used only for bootstrapping.
- After load, build `SessionEngine` and the snippet map from `data` (run whenever `data` changes, e.g. after invalidation):

```ts
	import { SessionEngine } from '$lib/session-engine/index.js';
	import type { Snippet } from '$lib/db/types.js';

	let engine = $state.raw<SessionEngine | null>(null);
	let snippetMap = $state(new Map<string, Snippet>());

	$effect(() => {
		snippetMap = new Map(Object.entries(data.snippetByQuestionId));
		engine = new SessionEngine(
			data.session,
			data.sessionStudents,
			data.students,
			data.allQuestions,
			data.attempts
		);
	});
```

Remove the old `onMount` Dexie block and `goto` redirects for missing session (404 comes from `load`).

- [ ] **Step 3: Verify run flow manually or with Playwright**

```bash
bun run test:e2e
```

(if no e2e covers run, do a quick manual run through `/sessions` → resume.)

- [ ] **Step 4: Commit** — `feat: load session run data via +page.ts`

---

### Task 9: Settings — backup module (no `+page.ts`)

**Files:**

- Create: `src/lib/db/backup.ts`
- Modify: `src/routes/settings/+page.svelte`

- [ ] **Step 1: Create `src/lib/db/backup.ts`**

Move the **export** and **import** transaction logic from `settings/+page.svelte` into:

- `export async function exportFullBackup(): Promise<void>` — same side effects (download blob) as current `exportData`.
- `export async function importFullBackupFromFile(file: File): Promise<{ ok: true } | { ok: false; error: string }>` — returns result instead of mutating component state; the Svelte file maps that to `importError` / `importSuccess`.

Implement by copying the existing `db` usage verbatim into this module and importing `db` from `./schema.js` only here.

- [ ] **Step 2: Update `src/routes/settings/+page.svelte`**

- Remove `import { db } from '$lib/db/schema.js'`.
- Import `exportFullBackup`, `importFullBackupFromFile` from `$lib/db/backup.js`.
- Wire buttons to these functions.

- [ ] **Step 3: Commit** — `refactor: move settings backup to lib/db/backup`

---

### Task 10 (recommended): Root `+error.svelte`

**Files:**

- Create: `src/routes/+error.svelte`

- [ ] **Step 1: Add minimal error page**

```svelte
<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center p-6 text-center">
	<h1 class="text-2xl font-semibold text-gray-900">
		{page.status === 404 ? 'Not found' : 'Something went wrong'}
	</h1>
	<p class="mt-2 text-gray-600">{page.error?.message ?? 'An error occurred.'}</p>
	<a href="/" class="mt-6 text-blue-600 hover:underline">Back to home</a>
</div>
```

- [ ] **Step 2: Commit** — `feat: add root error page for load errors`

---

### Task 11: Final verification

- [ ] **Step 1: Full check and tests**

```bash
bunx svelte-kit sync
bun run check
bun run test:unit -- --run
bun run test:e2e
```

- [ ] **Step 2: Commit** (only if fixes were needed) — `fix: align types after load migration`

---

## Plan self-review (spec coverage)

1. **Spec coverage:** Universal `+page.ts` for all listed readers — Tasks 1–8. Mutations + `invalidateAll` — Tasks 1, 6, 7. `error(404)` / `error(500)` — Tasks 1, 2, 4, 5, 6, 7, 8; soft load error only on `/sessions/new` — Task 3. Settings without direct `db` in Svelte — Task 9. Hybrid extraction — Task 1 loader module; other routes inline until duplication. No `+page.server.ts`, no SSR change.
2. **Placeholder scan:** No TBD steps; concrete file paths and code blocks throughout.
3. **Type consistency:** Exported view types (`PausedSessionView`, etc.) live in `+page.ts` next to `load`; `PageProps` / `./$types` consume them after `svelte-kit sync`.

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-07-sveltekit-load-dexie.md`. Two execution options:**

1. **Subagent-driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration. **Required sub-skill:** superpowers:subagent-driven-development.

2. **Inline execution** — Run tasks in this session with checkpoints. **Required sub-skill:** superpowers:executing-plans.

**Which approach do you want?**
