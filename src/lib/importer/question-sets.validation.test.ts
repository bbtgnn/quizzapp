import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { parseQuestionSetFile } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Vitest server project runs with cwd at repo root; this path matches that layout. */
const REPO_ROOT = path.resolve(__dirname, '../../..');

function collectJsonFiles(dir: string, acc: string[] = []): string[] {
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, ent.name);
		if (ent.isDirectory()) collectJsonFiles(full, acc);
		else if (ent.isFile() && ent.name.endsWith('.json')) acc.push(full);
	}
	return acc;
}

describe('bundled question-sets (D-13)', () => {
	it('parses every JSON file under question-sets/ through parseQuestionSetFile', () => {
		const dir = path.join(REPO_ROOT, 'question-sets');
		const files = collectJsonFiles(dir);
		expect(files.length).toBeGreaterThan(0);
		for (const abs of files) {
			const rel = path.relative(REPO_ROOT, abs);
			const raw = fs.readFileSync(abs, 'utf8');
			const result = parseQuestionSetFile(raw);
			if (!result.ok) {
				expect.fail(`${rel}: ${result.error}`);
			}
		}
	});
});
