# Testing

**Analysis Date:** 2026-04-07

## Unit and integration tests (Vitest)

- **Command:** `npm run test:unit` → `vitest` (see `package.json`)
- **Full test script:** `npm run test` runs unit with `--run` then E2E
- **Location:** Colocated tests such as:
  - `src/lib/session-engine/session-engine.test.ts`
  - `src/lib/importer/index.test.ts`
  - `src/lib/question-selector/strategies/default.test.ts`
  - `src/lib/student-orderer/strategies/default.test.ts`
  - `src/lib/vitest-examples/*.spec.ts` — examples (greet, Welcome component)

## Browser / component testing

- **@vitest/browser-playwright** and **vitest-browser-svelte** — Available for Svelte components in a real browser context (`src/lib/vitest-examples/Welcome.svelte.spec.ts`)

## End-to-end (Playwright)

- **Config:** `playwright.config.ts`
- **Server:** `npm run build && npm run preview` on port **4173**
- **Match:** `**/*.e2e.{ts,js}`
- **Example:** `src/routes/demo/playwright/page.svelte.e2e.ts`

## Type checking

- **`npm run check`** — `svelte-kit sync` + `svelte-check` (use before PRs)

## Practical guidance

- **SessionEngine** is constructed with injectable DB callbacks — **prefer injecting fakes/mocks** in tests (`SessionEngineOptions`) rather than hitting IndexedDB when testing pure logic
- **Dexie** in browser — for repository tests, consider in-memory or mock patterns; many tests may remain integration-style against real IndexedDB in browser Vitest if configured

---

*Testing analysis: 2026-04-07*
