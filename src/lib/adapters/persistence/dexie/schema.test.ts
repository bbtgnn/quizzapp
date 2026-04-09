import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Dexie schema versioning', () => {
	it('defines questions schema in version 3 without chain index', () => {
		const schemaPath = resolve(process.cwd(), 'src/lib/adapters/persistence/dexie/schema.ts');
		const schemaSource = readFileSync(schemaPath, 'utf8');

		expect(schemaSource).toMatch(/version\(3\)/);
		expect(schemaSource).toMatch(/questions:\s*'id,\s*question_set_id'/);

		const v3Block =
			schemaSource.match(/version\(3\)[\s\S]*?\.stores\(\{[\s\S]*?\}\)/)?.[0] ?? '';
		expect(v3Block).not.toContain('chain_parent_id');
	});
});
