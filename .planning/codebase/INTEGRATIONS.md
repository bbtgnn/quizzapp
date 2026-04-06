# External Integrations

**Analysis Date:** 2026-04-07

## Summary

**quizzapp** is a **fully client-side** SvelteKit static app. There is **no backend** in this repository for quiz/session persistence across devices. Persistence and “API” surface are **browser-only**.

## IndexedDB (Dexie)

- **Integration:** Dexie wraps the browser **IndexedDB** API
- **Database name:** `QuizAppDB` (`src/lib/db/schema.ts`)
- **Usage:** Classrooms, students, question sets, questions/snippets, sessions, session-students, attempts — see `src/lib/db/repositories/*.ts`
- **Notes:** Data stays on the user’s machine unless export/import or a future sync layer is added

## File system (import)

- **Browser File System Access** — Importer uses the File System Access API where available; see `src/lib/importer/` and `src/lib/importer/file-system-access.d.ts`
- **Purpose:** Import question-set JSON from disk into local DB

## Syntax highlighting

- **Shiki** — Renders code in UI (`CodeBlock` and related flows)

## Build / dev tooling (not runtime integrations)

- **Playwright** — Drives E2E against `vite preview` (see `playwright.config.ts`)
- **Vitest browser** — Optional browser-based unit/component tests

## Intentionally absent

- No OAuth, no REST/GraphQL server, no cloud database in this repo
- No analytics or error reporting SDKs observed in `package.json` dependencies

## Implications for new work

- **Cross-device sync, auth, or shared classrooms** would require **new** services (or third-party BaaS) and a clear security model — not present today

---

*Integrations analysis: 2026-04-07*
