# External Integrations

**Analysis Date:** 2026-04-09

## APIs & External Services

**Remote HTTP APIs:**

- Not used in application code under `src/` — no `fetch()` calls, no third-party REST/GraphQL clients, no `import.meta.env` / `process.env` service URLs.

**Bundled libraries (client-side only):**

- **marked** — parses markdown strings for question content display (`src/lib/components/MarkdownContent.svelte`).
- **shiki** — loads highlighter WASM/assets as part of the client bundle for code blocks (`src/lib/components/CodeBlock.svelte`).

## Data Storage

**Databases:**

- **IndexedDB** (via **Dexie**) — primary application data store in the browser.
  - Database name: `QuizAppDB` (`src/lib/adapters/persistence/dexie/schema.ts`).
  - Tables: `classrooms`, `students`, `questionSets`, `questions`, `sessions`, `sessionStudents`, `attempts`.
  - Repository adapters: `src/lib/adapters/persistence/dexie/*-repository.adapter.ts`; wiring in `src/lib/app/repositories.ts`.

**File Storage:**

- **Local filesystem (user-initiated)** — not a cloud service. Users pick files via `<input type="file">` for:
  - Question set JSON import: `src/routes/question-sets/import/+page.svelte` + parser `src/lib/importer/index.ts`.
  - Full backup restore: `src/routes/settings/+page.svelte` via `importFullBackupFromFile` in `src/lib/adapters/persistence/dexie/backup.ts`.
- **Download/export** — JSON backup blobs created in-browser (`exportFullBackup` in `src/lib/adapters/persistence/dexie/backup.ts`).

**Caching:**

- Browser HTTP cache / service worker: **not configured** in reviewed app files (no service worker in scope of standard SvelteKit static output unless added elsewhere).

## Authentication & Identity

**Auth Provider:**

- **None** — no login, OAuth, or session tokens. The app is a local-first SPA with no remote identity layer in `src/`.

## Monitoring & Observability

**Error Tracking:**

- None integrated (no Sentry, LogRocket, etc. in dependencies or `src/`).

**Logs:**

- **console** — e.g. `console.error` in `src/lib/components/CodeBlock.svelte` on Shiki init failure; import errors logged in `src/routes/question-sets/import/+page.svelte`.

## CI/CD & Deployment

**Hosting:**

- Not fixed by the repo — static build artifacts from `@sveltejs/adapter-static` can deploy to any static host.

**CI Pipeline:**

- No `.github/workflows` or other CI config detected in the repository root (may be added outside this snapshot).

## Environment Configuration

**Required env vars:**

- **None for the running app** — `src/` does not reference `import.meta.env` or `process.env`.

**Secrets location:**

- Not applicable for core app behavior; local dev tooling may use env vars unrelated to the quiz UI.

## Webhooks & Callbacks

**Incoming:**

- None — no `+server.ts` routes or API handlers.

**Outgoing:**

- None — no webhooks or server-to-server callbacks from application code.

---

*Integration audit: 2026-04-09*
