# Codebase Concerns

**Analysis Date:** 2026-04-09

## Tech Debt

**Dexie schema v1 → v2 migration (destructive):**

- Issue: Upgrade path explicitly performs a clean break with no data migration; IndexedDB content from v1 is discarded when the schema upgrades.
- Files: `src/lib/adapters/persistence/dexie/schema.ts`
- Impact: Users on older DB versions lose local data on upgrade unless they exported a backup first.
- Fix approach: Document the risk in-app (settings/backup UX), or implement a one-time migration that maps old `snippets`/questions into the v2 shape before dropping tables.

**Large importer module:**

- Issue: `parseQuestionSetFile` and helpers live in a single ~245-line file with no split by concern; growth will increase merge conflict risk.
- Files: `src/lib/importer/index.ts`
- Impact: Harder to extend question types or reuse parsers in tests without loading the whole surface.
- Fix approach: Extract `parseContentConfig` / `parseAnswerConfig` into `src/lib/importer/` modules and re-export from a thin `index.ts`.

**Demo and example assets in `src/`:**

- Issue: `src/routes/demo/` and `src/lib/vitest-examples/` ship with the app bundle and add maintenance noise unrelated to product features.
- Files: `src/routes/demo/+page.svelte`, `src/routes/demo/playwright/+page.svelte`, `src/lib/vitest-examples/Welcome.svelte`, `src/lib/vitest-examples/greet.ts`
- Impact: Larger prerender surface, dead links risk if demo drifts, confusion about what is production UI.
- Fix approach: Remove or gate behind dev-only routes; keep examples in `tests/` or docs if still needed.

**Package scripts vs Bun:**

- Issue: `package.json` scripts invoke `npm run` (e.g. root `test`, Playwright `webServer`) while project conventions specify Bun.
- Files: `package.json`, `playwright.config.ts`
- Impact: Inconsistent toolchain in CI/local; possible double lockfile confusion.
- Fix approach: Align scripts and Playwright `webServer` with `bun run` where appropriate.

## Known Bugs

**Load failures surfaced only via console in some flows:**

- Symptoms: Several `load` functions catch errors, log with `console.error`, and rethrow or return empty data; users may see generic empty states without an actionable message.
- Files: `src/routes/+page.ts`, `src/routes/sessions/+page.ts`, `src/routes/history/+page.ts`, `src/routes/question-sets/+page.ts`, `src/routes/sessions/new/+page.ts`, `src/routes/sessions/[id]/run/+page.ts`, `src/routes/history/[id]/+page.ts`, `src/routes/classrooms/[id]/+page.ts`
- Trigger: IndexedDB or repository errors during navigation.
- Workaround: Open browser devtools console; retry after refresh.

## Security Considerations

**Unsanitized Markdown rendered with `{@html}`:**

- Risk: Question content uses `marked.parse` and is injected as HTML in `MarkdownContent`. Imported JSON can include raw HTML or markdown that expands to script-bearing markup, leading to XSS in the same origin as the app.
- Files: `src/lib/components/MarkdownContent.svelte`
- Current mitigation: None beyond trusting imported files; ESLint allows `svelte/no-at-html-tags` for this line only.
- Recommendations: Sanitize HTML after parse (e.g. DOMPurify in the browser), or render markdown to a safe AST and map to components without raw HTML.

**Backup import trusts file shape:**

- Risk: `importFullBackupFromFile` validates `version === 2` and array presence but uses type assertions when calling `bulkAdd`. A malicious or corrupted backup could write unexpected fields into IndexedDB rows.
- Files: `src/lib/adapters/persistence/dexie/backup.ts`
- Current mitigation: User must confirm destructive replace; JSON is same-origin file picker only.
- Recommendations: Validate each row against `src/lib/model/types.ts` shapes before insert, or use Zod/io-ts schemas for backup payloads.

**No authentication or server-side enforcement:**

- Risk: Static SPA with client-only storage; anyone with device access can read or export data. No multi-user isolation.
- Files: App-wide (`svelte.config.js` adapter-static, no `hooks.server.ts`)
- Current mitigation: Appropriate for local-only classroom tool.
- Recommendations: If cloud sync is added, treat this as a full redesign (auth, transport security, data separation).

## Performance Bottlenecks

**Per-mount Shiki highlighter instances:**

- Problem: Each `CodeBlock` instance runs `createHighlighter` in `onMount`, loading themes and grammars independently.
- Files: `src/lib/components/CodeBlock.svelte`
- Cause: No singleton or shared highlighter module.
- Improvement path: One shared `Highlighter` (or lazy module singleton) reused across components; optionally limit concurrent language loads.

**Large domain test files:**

- Problem: `session-engine.test.ts` and `importer/index.test.ts` are very large; slow CI feedback and harder failure diagnosis.
- Files: `src/lib/domain/session-engine/session-engine.test.ts`, `src/lib/importer/index.test.ts`
- Cause: Broad integration-style coverage in single files.
- Improvement path: Split cases with `describe` blocks into separate files or use project tags in Vitest.

## Fragile Areas

**Session run page (`+page.svelte`):**

- Files: `src/routes/sessions/[id]/run/+page.svelte`
- Why fragile: Combines `SessionEngine`, keyboard handling, player transitions, MC/TF/open flows, and persistence in one of the largest Svelte files in the repo.
- Safe modification: Change one concern at a time; run `src/lib/domain/session-engine/session-engine.test.ts` and manual run-through of a session after edits.
- Test coverage: Domain engine is tested; the Svelte page has no dedicated component test.

**Backup/restore:**

- Files: `src/lib/adapters/persistence/dexie/backup.ts`, `src/routes/settings/+page.svelte` (if wired there)
- Why fragile: Full clear + bulk add is all-or-nothing; partial failure states depend on Dexie transaction behavior.
- Safe modification: Add integration tests that export then import round-trip with representative data; avoid changing `version` without migration notes.

## Scaling Limits

**IndexedDB and static hosting:**

- Current capacity: Single-browser, single-device storage; subject to browser quotas and eviction policies.
- Limit: No sync across devices; clearing site data wipes state without backup.
- Scaling path: Backend + auth + sync, or explicit PWA offline docs for backup discipline.

## Dependencies at Risk

**`marked` (Markdown parsing):**

- Risk: Major version bumps can change HTML output and XSS surface.
- Impact: Rendering and any sanitization strategy must be revalidated after upgrades.
- Migration plan: Pin and review changelog; add regression tests for sample question markdown.

**`dexie`:**

- Risk: Schema API misuse can corrupt stores; upgrades are easy to get wrong.
- Impact: Data loss or failed opens for users mid-upgrade.
- Migration plan: Follow Dexie upgrade docs; add automated tests for `version(n).upgrade` paths when changing `schema.ts`.

## Missing Critical Features

**Automated CI pipeline:**

- Problem: No `.github/workflows/` detected in-repo; quality gates may rely entirely on local runs.
- Blocks: Consistent lint/test enforcement across contributors and PRs.

**Centralized error reporting for users:**

- Problem: Errors often end in `console.error` with generic UI copy ("Check the console").
- Blocks: Non-technical users diagnosing failures without developer tools.

## Test Coverage Gaps

**Route and UI layers:**

- What's not tested: Most files under `src/routes/**` lack `*.test.ts` / component tests; behavior is exercised indirectly or manually.
- Files: e.g. `src/routes/sessions/[id]/run/+page.svelte`, `src/routes/classrooms/[id]/+page.svelte`, `src/routes/settings/+page.svelte`
- Risk: Regressions in navigation, forms, and accessibility go unnoticed until manual QA.
- Priority: High for session run and import flows; Medium for list pages.

**End-to-end coverage:**

- What's not tested: Playwright matches `**/*.e2e.{ts,js}`; only demo-scoped e2e found under `src/routes/demo/playwright/page.svelte.e2e.ts`.
- Files: `playwright.config.ts`, `src/routes/demo/playwright/page.svelte.e2e.ts`
- Risk: Core user journeys (create classroom, run session, backup) are not automated in CI.
- Priority: High for primary flows if the project moves toward continuous delivery.

---

*Concerns audit: 2026-04-09*
