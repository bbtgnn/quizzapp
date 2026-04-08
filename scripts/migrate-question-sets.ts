/**
 * Maintainer migration (D-10, D-11): rewrites bundled JSON under question-sets/ to the single
 * logical import contract: { name, schemaVersion: 1, questions: [{ shared?, steps[], difficulty? }] }.
 *
 * Branches:
 * - Already migrated: schemaVersion === 1 and every question has non-empty `steps` → skip.
 * - Legacy snippet format: root `snippet` + `questions[]` with `text` / `correctAnswer` / optional `chain[]`
 *   → shared code-snippet (language+code only), one step per legacy row; `referenceAnswer` from correctAnswer (D-12);
 *   each step gets `range` from `snippet.highlight` or default 1..lineCount of snippet code.
 * - Importer-style: `name` + questions with `text`, `content`, `answer` (no schemaVersion) → shared from content
 *   (code-snippet import shape strips highlight), steps from root + chain in order; step `range` from content.highlight
 *   or full-file line count for code-snippet.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QuestionSetFileSchema } from '../src/lib/importer/question-set.schema.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const QUESTION_SETS_DIR = path.join(REPO_ROOT, 'question-sets');

type Json = Record<string, unknown>;

function isRecord(v: unknown): v is Json {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function collectJsonFiles(dir: string, acc: string[] = []): string[] {
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, ent.name);
		if (ent.isDirectory()) collectJsonFiles(full, acc);
		else if (ent.isFile() && ent.name.endsWith('.json')) acc.push(full);
	}
	return acc;
}

function relativeToRepo(abs: string): string {
	return path.relative(REPO_ROOT, abs);
}

function deriveName(relPath: string): string {
	const dir = path.dirname(relPath);
	const folderBasename = path.basename(dir);
	const stem = path.basename(relPath, '.json');
	return `${folderBasename} / ${stem}`;
}

function lineCount(code: string): number {
	const n = code.split('\n').length;
	return Math.max(1, n);
}

function isAlreadyMigrated(data: Json): boolean {
	if (data.schemaVersion !== 1) return false;
	if (!Array.isArray(data.questions) || data.questions.length === 0) return false;
	return data.questions.every(
		(q) => isRecord(q) && Array.isArray(q.steps) && q.steps.length >= 1
	);
}

function migrateSnippetLegacy(relPath: string, data: Json): Json {
	const snippet = data.snippet;
	if (!isRecord(snippet)) throw new Error(`${relPath}: invalid snippet`);
	const language = snippet.language;
	const code = snippet.code;
	if (typeof language !== 'string' || typeof code !== 'string') {
		throw new Error(`${relPath}: snippet.language and snippet.code must be strings`);
	}
	const hl = snippet.highlight;
	const defaultRange =
		isRecord(hl) && typeof hl.startLine === 'number' && typeof hl.endLine === 'number'
			? { startLine: hl.startLine, endLine: hl.endLine }
			: { startLine: 1, endLine: lineCount(code) };

	const shared = {
		content: { type: 'code-snippet' as const, language, code }
	};

	const questionsRaw = data.questions;
	if (!Array.isArray(questionsRaw)) throw new Error(`${relPath}: questions must be array`);

	const questions = questionsRaw.map((q, qi) => {
		if (!isRecord(q)) throw new Error(`${relPath}: questions[${qi}] invalid`);
		const text = q.text;
		const correctAnswer = q.correctAnswer;
		if (typeof text !== 'string' || typeof correctAnswer !== 'string') {
			throw new Error(`${relPath}: questions[${qi}] needs text and correctAnswer`);
		}
		const steps: Json[] = [
			{
				text,
				answer: { type: 'open', referenceAnswer: correctAnswer },
				range: { ...defaultRange }
			}
		];
		const chain = q.chain;
		if (Array.isArray(chain)) {
			for (let j = 0; j < chain.length; j++) {
				const item = chain[j];
				if (!isRecord(item)) throw new Error(`${relPath}: chain[${j}] invalid`);
				const ct = item.text;
				const ca = item.correctAnswer;
				if (typeof ct !== 'string' || typeof ca !== 'string') {
					throw new Error(`${relPath}: chain[${j}] needs text and correctAnswer`);
				}
				steps.push({
					text: ct,
					answer: { type: 'open', referenceAnswer: ca },
					range: { ...defaultRange }
				});
			}
		}
		const logical: Json = { shared, steps };
		if (typeof q.difficulty === 'string') logical.difficulty = q.difficulty;
		return logical;
	});

	return {
		name: deriveName(relPath),
		schemaVersion: 1,
		questions
	};
}

function contentToSharedImportShape(content: Json): Json {
	const t = content.type;
	if (t === 'markdown') {
		const body = content.body;
		if (typeof body !== 'string') throw new Error('markdown content.body must be string');
		return { type: 'markdown', body };
	}
	if (t === 'code-snippet') {
		const language = content.language;
		const code = content.code;
		if (typeof language !== 'string' || typeof code !== 'string') {
			throw new Error('code-snippet content needs language and code');
		}
		return { type: 'code-snippet', language, code };
	}
	throw new Error(`unsupported content.type: ${String(t)}`);
}

function highlightToRange(content: Json, code: string): { startLine: number; endLine: number } {
	const hl = content.highlight;
	if (isRecord(hl) && typeof hl.startLine === 'number' && typeof hl.endLine === 'number') {
		return { startLine: hl.startLine, endLine: hl.endLine };
	}
	return { startLine: 1, endLine: lineCount(typeof content.code === 'string' ? content.code : code) };
}

function migrateImporterStyle(relPath: string, data: Json): Json {
	const name =
		typeof data.name === 'string' && data.name.trim() !== '' ? data.name : deriveName(relPath);
	const questionsRaw = data.questions;
	if (!Array.isArray(questionsRaw)) throw new Error(`${relPath}: questions must be array`);

	const questions = questionsRaw.map((q, qi) => {
		if (!isRecord(q)) throw new Error(`${relPath}: questions[${qi}] invalid`);
		const content = q.content;
		const answer = q.answer;
		const text = q.text;
		if (!isRecord(content) || !isRecord(answer) || typeof text !== 'string') {
			throw new Error(`${relPath}: questions[${qi}] needs text, content, answer`);
		}
		const shared = { content: contentToSharedImportShape(content) };
		const codeForRange = typeof content.code === 'string' ? content.code : '';
		const range =
			content.type === 'code-snippet'
				? highlightToRange(content, codeForRange)
				: undefined;

		const steps: Json[] = [{ text, answer, ...(range ? { range } : {}) }];
		const chain = q.chain;
		if (Array.isArray(chain)) {
			for (let j = 0; j < chain.length; j++) {
				const item = chain[j];
				if (!isRecord(item)) throw new Error(`${relPath}: chain[${j}] invalid`);
				const ct = item.text;
				const ca = item.answer;
				if (typeof ct !== 'string' || !isRecord(ca)) {
					throw new Error(`${relPath}: chain[${j}] needs text and answer`);
				}
				const stepRange =
					content.type === 'code-snippet' ? highlightToRange(content, codeForRange) : undefined;
				steps.push({ text: ct, answer: ca, ...(stepRange ? { range: stepRange } : {}) });
			}
		}
		const logical: Json = { shared, steps };
		if (typeof q.difficulty === 'string') logical.difficulty = q.difficulty;
		return logical;
	});

	return { name, schemaVersion: 1, questions };
}

function transformFile(absPath: string): void {
	const rel = relativeToRepo(absPath);
	const rawText = fs.readFileSync(absPath, 'utf8');
	const data = JSON.parse(rawText) as unknown;
	if (!isRecord(data)) throw new Error(`${rel}: root must be object`);

	if (isAlreadyMigrated(data)) {
		console.log(`skip (already migrated): ${rel}`);
		return;
	}

	let out: Json;
	if ('snippet' in data) {
		out = migrateSnippetLegacy(rel, data);
	} else if (Array.isArray(data.questions) && data.questions[0] && isRecord(data.questions[0])) {
		const q0 = data.questions[0] as Json;
		if ('content' in q0 && 'answer' in q0 && 'text' in q0) {
			out = migrateImporterStyle(rel, data);
		} else {
			throw new Error(`${rel}: unrecognized question shape`);
		}
	} else {
		throw new Error(`${rel}: unrecognized file shape`);
	}

	const parsed = QuestionSetFileSchema.safeParse(out);
	if (!parsed.success) {
		console.error(parsed.error.format());
		throw new Error(`${rel}: migrated data failed schema validation`);
	}

	fs.writeFileSync(absPath, `${JSON.stringify(parsed.data, null, '\t')}\n`, 'utf8');
	console.log(`migrated: ${rel}`);
}

function main(): void {
	if (!fs.existsSync(QUESTION_SETS_DIR)) {
		console.error('question-sets/ not found');
		process.exit(1);
	}
	const files = collectJsonFiles(QUESTION_SETS_DIR);
	if (files.length === 0) {
		console.error('no JSON files under question-sets/');
		process.exit(1);
	}
	for (const f of files) transformFile(f);
}

main();
