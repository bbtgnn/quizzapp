# Testing Patterns

**Analysis Date:** 2026-04-09

## Test Framework

**Runner:**

- **Vitest** `^4.1.0` — config lives in `vite.config.ts` under `test:` (no separate `vitest.config.*`).

**Assertion Library:**

- Vitest built-in `expect` — **`expect: { requireAssertions: true }`** is set globally in `vite.config.ts` (every test must contain at least one assertion).

**Projects (dual environment):**

1. **`client`** — **Vitest Browser Mode** with **`@vitest/browser-playwright`** and Playwright provider; Chromium headless. Includes only `src/**/*.svelte.{test,spec}.{js,ts}`, excludes `src/lib/server/**`.
2. **`server`** — **`environment: 'node'`**. Includes `src/**/*.{test,spec}.{js,ts}` but **excludes** `src/**/*.svelte.{test,spec}.{js,ts}` so Svelte component tests run only in the browser project.

**Run Commands:**

```bash
npm run test:unit              # Vitest (watch / interactive)
npm run test:unit -- --run     # Single run (CI-style)
npm run test                   # Unit run + E2E (see package.json: chains test:e2e)
npm run test:e2e               # Playwright E2E only
```

Use `bun run` instead of `npm run` if that is the local package manager; scripts are defined in `package.json`.

## Test File Organization

**Location:**

- **Co-located** next to the module under test — e.g. `src/lib/importer/index.test.ts`, `src/lib/domain/session-engine/session-engine.test.ts`.

**Naming:**

- **`*.test.ts`** or **`*.spec.ts`** for Node (server project).
- **Component tests:** **`*.svelte.spec.ts`** or **`*.svelte.test.ts`** — matched by the client project `include` in `vite.config.ts`.

**Structure:**

```
src/lib/
├── importer/
│   ├── index.ts
│   └── index.test.ts
├── domain/session-engine/
│   ├── index.ts
│   └── session-engine.test.ts
├── vitest-examples/
│   ├── greet.spec.ts
│   ├── Welcome.svelte
│   └── Welcome.svelte.spec.ts
└── ...
```

**Examples / demos:**

- `src/lib/vitest-examples/` holds minimal `greet` + `Welcome.svelte` samples for Vitest browser + unit patterns.

## Test Structure

**Suite Organization:**

```typescript
import { describe, it, expect } from 'vitest';

describe('feature name', () => {
	it('does expected behavior', () => {
		expect(actual).toBe(expected);
	});
});
```

**Nested `describe`:** Used for grouping flows — e.g. `describe('SessionEngine', () => { describe('chain questions', () => { ... }); });` in `src/lib/domain/session-engine/session-engine.test.ts`.

**Patterns:**

- **Setup:** `beforeEach(() => { vi.clearAllMocks(); })` where mocks are shared — see `src/lib/data/loaders/classrooms-index.test.ts`.
- **Async:** `it('...', async () => { await ... })` for engines and loaders.
- **Narrowing after Result types:** `if (!result.ok) return;` then assert on `result.data` — see `src/lib/importer/index.test.ts`.

## Mocking

**Framework:** **Vitest** — `vi.fn()`, `vi.mock` available; heavy use of **`vi.fn().mockResolvedValue`** for async repository methods.

**Patterns:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const listSessions = vi.fn().mockResolvedValue([a, b]);
const sessions: SessionRepository = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	listSessions,
	updateSession: vi.fn(),
	// ... all port methods stubbed
};
```

Reference: `src/lib/application/sessions/sessions.service.test.ts`, `src/lib/application/question-sets/persist-question-set.test.ts`.

**Inline fake repositories:** Objects implementing port interfaces with spies — no separate `__mocks__` directory pattern detected.

**What to Mock:**

- **Repository / port methods** when testing application services and loaders.
- **Partial engine dependencies** via hand-rolled `makeMockRepos()` recording call arrays — `src/lib/domain/session-engine/session-engine.test.ts`.

**What NOT to Mock:**

- **Pure domain strategies** tested with plain data factories — `src/lib/domain/question-selector/strategies/default.test.ts`.

## Fixtures and Factories

**Test Data:**

```typescript
const makeStudent = (id: string): Student => ({ id, classroom_id: 'c1', name: `Student ${id}` });
```

**Location:**

- Factories are **local to the test file** (not a shared `test/factories` tree).

## Coverage

**Requirements:** **None enforced** — no `coverage` script in `package.json`, no `@vitest/coverage-*` dependency. `.gitignore` includes `coverage/` for if/when reports are generated.

**View Coverage:**

- Add a coverage provider (e.g. `@vitest/coverage-v8`) and run `vitest run --coverage`, or extend `package.json` scripts when the team adopts a threshold.

## Test Types

**Unit Tests:**

- Domain engines, strategies, importer parsing, application services, data loaders — all under `src/lib/**` with `*.test.ts` / `*.spec.ts`.

**Integration Tests:**

- Not a separate layer; repository behavior is tested via **mocked** ports, not live Dexie in unit files surveyed.

**E2E Tests:**

- **Playwright** `@playwright/test` — config: `playwright.config.ts`.
- **Match pattern:** `**/*.e2e.{ts,js}`.
- **Web server:** `npm run build && npm run preview` on port **4173**.
- **Example:** `src/routes/demo/playwright/page.svelte.e2e.ts` — `test('has expected h1', async ({ page }) => { await page.goto('/demo/playwright'); ... })`.

## Common Patterns

**Async Testing:**

```typescript
it('delegates to repository and sorts', async () => {
	const result = await listSessionsOrderedByStartedAt(sessions);
	expect(result.map((s) => s.id)).toEqual(['b', 'a']);
});
```

**Browser / component (Vitest browser + vitest-browser-svelte):**

```typescript
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';

render(Welcome, { host: 'SvelteKit', guest: 'Vitest' });
await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Hello, SvelteKit!');
```

Reference: `src/lib/vitest-examples/Welcome.svelte.spec.ts`.

**Error path testing (Result unions):**

```typescript
const result = parseQuestionSetFile(input);
expect(result.ok).toBe(false);
if (result.ok) return;
expect(result.error).toMatch(/language/);
```

Reference: `src/lib/importer/index.test.ts`.

---

*Testing analysis: 2026-04-09*
