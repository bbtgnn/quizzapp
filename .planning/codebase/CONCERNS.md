# Technical Concerns

**Analysis Date:** 2026-04-07

## Data and persistence

- **Single-device storage:** IndexedDB holds all classrooms, sessions, and attempts. **No sync** — users lose access if they clear site data or switch browsers/machines unless export/import exists and is used
- **Schema migrations:** Dexie is at **version 1** (`src/lib/db/schema.ts`). Future schema changes need **versioned migrations** and careful testing to avoid bricking existing users’ DBs

## Security and privacy

- **No server auth** — Appropriate for local-only; any future “teacher accounts” or cloud backup must not assume secrets in the static client bundle
- **Imported JSON** — Validate/sanitize question-set imports to avoid unexpected content execution paths (treat as data, not HTML)

## Package manager drift

- Docs reference **bun**; some scripts use **npm**. CI and contributors should standardize to avoid lockfile/tooling mismatch

## Testing gaps (observational)

- Core UI routes may have **limited E2E coverage** beyond demo routes — session flows are critical for regressions
- **IndexedDB** in automated tests can be **flaky or environment-specific** — document patterns once established

## Dependency surface

- **SvelteKit + Vite 7 + Tailwind 4** — Fast-moving stack; upgrades should run `check`, `lint`, and full `test`

## No `TODO`/`FIXME` grep hits

- No tracked `TODO`/`FIXME` in `src/` at analysis time — technical debt may still exist without those markers

---

*Concerns analysis: 2026-04-07*
