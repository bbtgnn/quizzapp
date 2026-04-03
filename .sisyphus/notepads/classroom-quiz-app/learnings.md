# Learnings

## [2026-04-03] Session start

- Stack: SvelteKit + Svelte 5 runes + TypeScript + Tailwind CSS + Vitest + Playwright
- Package manager: bun
- Adapter: @sveltejs/adapter-static (frontend only, no SSR)
- No backend, no auth, no accounts
- IndexedDB via Dexie.js v4.4.2 (installed)

## [2026-04-03] Issue 01 — DB layer

- Dexie v4: use `EntityTable<T, 'id'>` for typed tables (import from 'dexie')
- Dexie v4: `db.version(1).stores({...})` uses string-based index specs; non-indexed fields are stored but not queryable by index
- `[session_id+student_id]` compound index syntax works in Dexie stores spec
- All timestamps stored as `number` (Unix ms via `Date.now()`)
- `crypto.randomUUID()` used for all id generation — available in modern browsers and Node 19+
- Repository pattern: each repo imports `db` from `schema.ts`, no business logic
- `deleteClassroom` cascades to students inside a transaction
- `deleteQuestionSet` cascades to snippets → questions inside a transaction
- Barrel export in `src/lib/db/index.ts` re-exports db singleton + all types + all repo functions
- `bun run check` passed with 0 errors and 0 warnings after implementation
- Syntax highlighting via Shiki (to be installed)
- File System Access API for folder import (Chrome/Edge only)
- src/lib/ is the lib directory for shared modules
- All routes under src/routes/

## [2026-04-03] Issue 05 — Pluggable question selector

- Pure TS module, no DB calls, no UI
- `QuestionSelectionStrategy` interface: `pick(student, attempts, availableQuestions): Question`
- Default strategy: filter needsWork (never attempted OR most recent outcome wrong/partial); if empty → cycle from oldest correct `answered_at`
- Use `mostRecentByQuestion` Map built from attempts filtered by `student_id` to handle multi-attempt history correctly
- Registry: `Map<string, QuestionSelectionStrategy>` pre-seeded with `'default'`; `getStrategy` throws on unknown id
- Barrel export via `src/lib/question-selector/index.ts`
- Vitest server project (node environment) runs `.{test,spec}.{js,ts}` files; 9/9 tests pass
- Playwright browser binary missing is a pre-existing env issue; does not affect server unit tests

## [2026-04-03] Issue 06 — Pluggable student orderer

- `StudentOrderStrategy` interface: `order(students: Student[], sessionStudents: SessionStudent[]): Student[]`
- Default strategy: Fisher-Yates shuffle of students where `SessionStudent.completed === false`; students with no `SessionStudent` record are treated as remaining (included)
- Use a `Set<string>` of `student_id`s from completed `SessionStudent` records for O(1) lookup
- Registry follows identical pattern to `question-selector/registry.ts`: `Map<string, Strategy>`, `getStrategy` throws on unknown id, `registerStrategy` for extensibility
- Barrel export via `src/lib/student-orderer/index.ts` mirrors `question-selector/index.ts`
- Probabilistic shuffle-randomness test: 10 calls on 20-element list, assert `unique.size > 1` — statistically sound (20! permutations make collision probability negligible)
- 16/16 unit tests pass (4 test files total) after implementation

## [2026-04-03] Issue 10 — Code highlighter Svelte component

- Installed `shiki` via `bun add shiki`
- Created `CodeBlock.svelte` component using Svelte 5 runes (`$props`, `$state`, `$effect`)
- Initialized Shiki lazily in `onMount` to avoid SSR issues with `adapter-static`
- Used Shiki's `transformers` API (`this.addClassToHast`) to apply Tailwind classes (`bg-yellow-500/20 w-full inline-block`) to highlighted lines
- Handled loading and error states gracefully
- Created a demo route at `src/routes/demo/+page.svelte` to verify the component visually
- `bun run check` passed with 0 errors and 0 warnings

## [2026-04-03] Issue 02 — Classroom management UI

- Built home screen (`/`) to list classrooms with student counts
- Built create classroom page (`/classrooms/new`) with dynamic student inputs
- Built edit classroom page (`/classrooms/[id]`) to rename, add/remove students, and delete classroom
- Used Svelte 5 runes (`$state`, `$derived`) and `onMount` for client-side DB loading
- Used Tailwind CSS v4 utility classes for styling
- Handled loading states, empty states, and error states
- Used `goto` from `$app/navigation` for programmatic navigation
- `bun run check` passed with 0 errors and 0 warnings

## [2026-04-03] Issue 07 — Session engine

- `SessionEngine` class in `src/lib/session-engine/index.ts` orchestrates full session lifecycle
- Constructor accepts optional repo overrides (`SessionEngineOptions`) for testability — avoids real IndexedDB in unit tests
- Use `NonNullable<SessionEngineOptions['createAttempt']>` for private field types instead of `typeof importedFn` — cleaner and avoids import coupling
- `_sessionStudentsMap: Map<string, SessionStudent>` keyed by `student_id` with spread copies for local mutation
- For paused sessions: call `getStudentStrategy('default').order(students, sessionStudents)` to re-randomize remaining students
- For active sessions: filter `students` array to those with `SessionStudent.completed === false` (preserves original order)
- `_pickQuestion()` returns `Question | null` — guards against empty questions array
- `progress.slotsTotalForCurrentStudent` must be 0 when session is complete (no current student), not `n_questions_per_student`
- Mock repos pattern: plain async functions + call-tracking arrays (no vi.fn needed) — fully type-safe, no `as any`
- `_attempts.push(attempt)` (mutate in place) works fine since `_attempts` is not `readonly`
- 23/23 unit tests pass across 5 test files; `bun run check` 0 errors 0 warnings

## [2026-04-03] Issue 03 — Question set importer

- `src/lib/importer/index.ts`: pure parse+validate, no DB calls; returns `{ ok: true; data }` or `{ ok: false; error }` discriminated union
- TypeScript 5.9 `lib.dom.d.ts` does NOT include `showDirectoryPicker` on Window; created `src/lib/importer/file-system-access.d.ts` as an ambient `.d.ts` to declare `Window.showDirectoryPicker` and `FileSystemDirectoryHandle[Symbol.asyncIterator]`
- `lib.dom.asynciterable.d.ts` exists in TypeScript but is NOT listed in `.svelte-kit/tsconfig.json`'s lib array — needed custom ambient declarations
- Iterate directory handle: `for await (const [name, handle] of dirHandle)` — cast individual file handle with `handle as FileSystemFileHandle` (kind check first)
- ONE QuestionSet per folder (use `dirHandle.name`), all snippets belong to same QuestionSet
- Chain questions: root question created with `chain_parent_id: null, chain_order: 0`; chain items use `chain_parent_id: rootQ.id, chain_order: i + 1`
- `hasDirectoryPicker = 'showDirectoryPicker' in window` — must be in `onMount` to avoid SSR issues with adapter-static
- abortError on `showDirectoryPicker()` (user cancels picker) → catch and return silently (no error UI)
- 33/33 unit tests pass; `bun run check` 0 errors 0 warnings

## [2026-04-03] Issue 13 — Data export/import settings page

- Settings page at `src/routes/settings/+page.svelte` — no server-side load function, pure client-side
- Import `db` directly from `$lib/db/schema.js` for bulk table access (`.toArray()`, `.clear()`, `.bulkAdd()`)
- `bulkAdd` type: pass the array as `Parameters<typeof db.tableName.bulkAdd>[0]` to satisfy Dexie's typed EntityTable without `as any`
- Export uses `URL.createObjectURL` + a dynamically-created `<a>` click + `URL.revokeObjectURL` — all browser-side, no server needed
- JSON backup has a `version: 1` field; importer checks for it and rejects unknown versions before touching DB
- Import wrapped in `db.transaction('rw', [...allTables...], async () => {...})` — clears then bulkAdds; atomic, no partial writes
- Invalid JSON caught before DB access; existing data never corrupted on parse failure
- `confirm()` dialog gates the destructive replace — no custom modal needed
- File input reset (`input.value = ''`) after each pick so the same file can be re-imported if needed
- Settings link added to home page header alongside "New Classroom" button
- `bun run check`: 0 errors, 0 warnings; 33/33 unit tests still pass

## Issue 04: Question set list & delete screen
- Used `$state` and `onMount` for reactive state and initial data loading in Svelte 5.
- Used `Promise.all` to fetch snippet and question counts in parallel for each question set.
- Followed the existing card grid pattern and empty state pattern from the home page.
- Added a "Question Sets" link to the home page navigation.

## Issue 08: Session setup UI
- Used Svelte 5 runes (`$state`, `$derived`) for state management in forms and lists.
- Implemented client-side data loading with `onMount` and `Promise.all` for parallel DB queries.
- Handled a11y warnings by using `<span>` instead of `<label>` for groups of checkboxes.
- Ensured all DB calls are client-side as required by `adapter-static`.
- Svelte 5: Use `page.params.id` from `$app/state` for dynamic route parameters, but remember it can be undefined in TypeScript, so always check for its existence before using it.

## Session Execution UI
- When building a SPA with SvelteKit and `adapter-static`, dynamic routes (like `/sessions/[id]/run`) will cause the build to fail unless `fallback: 'index.html'` is set in the adapter config and `prerender: { handleUnseenRoutes: 'ignore' }` is added to `svelte.config.js`.
- Alternatively, adding `export const ssr = false; export const prerender = true;` to `src/routes/+layout.ts` ensures the app is treated as a SPA.
- For global keyboard shortcuts, `<svelte:window onkeydown={...} />` is much cleaner and avoids accessibility warnings compared to adding `tabindex` and `onkeydown` to a `<div>`.
- When using a class instance (like `SessionEngine`) in Svelte 5 `$state`, internal mutations aren't automatically tracked. A reactive `tick` counter (`let tick = $state(0)`) that increments after mutations can be used to force `$derived` values to re-evaluate.

## [2026-04-03] Issue 11 — Question chains in session

- Chain state (`_chainQuestions`, `_chainIndex`, `_chainOutcomes`) lives entirely in `SessionEngine`; empty arrays = not in a chain
- `_pickQuestion()` now filters to `chain_parent_id === null` root questions before handing to the selector; children are never picked directly
- Chain children are found by `filter(q => q.chain_parent_id === rootQ.id).sort((a,b) => a.chain_order - b.chain_order)` — stable sort by `chain_order`
- `recordOutcome()` early-returns after advancing `_chainIndex` when sub-questions remain; only the ROOT question gets an Attempt (with aggregate outcome)
- Aggregate outcome rule: all correct → `'correct'`; any wrong → `'wrong'`; else → `'partial'`
- `_consumeSlot()` extracted as private method to avoid duplicating slot-decrement logic between chain and standalone paths
- `chainProgress` getter returns `{ current, total }` (1-based) during chain, `null` otherwise — driven by `_chainQuestions.length`
- UI: `chainProgress` derived from `tick >= 0 ? engine?.chainProgress : null`; shown with `{#if chainProgress}` block inside the header
- Write tool cannot overwrite an existing file (use Edit); doing a Write on existing file causes duplicate content if Edit was also called
- `bun run check` 0 errors 0 warnings; 38/38 unit tests pass (5 new chain tests)
