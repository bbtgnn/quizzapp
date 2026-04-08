# Technology Stack

**Analysis Date:** 2026-04-09

## Languages

**Primary:**

- TypeScript (5.9.x per `package.json`) — application source under `src/`, tests, config (`vite.config.ts`, `playwright.config.ts`).

**Secondary:**

- JavaScript — `svelte.config.js`, `eslint.config.js` (ESM).
- JSON — question set content in `question-sets/` and backup/export payloads (`src/lib/adapters/persistence/dexie/backup.ts`).
- CSS — `src/routes/layout.css` (Tailwind v4 entry via `@import 'tailwindcss'`).

## Runtime

**Environment:**

- **Browser** — primary runtime for the built app: client-only SvelteKit (`src/routes/+layout.ts` sets `ssr = false`, `prerender = true`).
- **Node.js** — dev server (Vite), build (`vite build`), Vitest (node project + browser project), Playwright test runner.

**Package Manager:**

- **bun** — project convention (`CLAUDE.md`, `AGENTS.md`); lockfile: `bun.lock` present.
- `package.json` scripts use `npm run` for some commands (e.g. `test`); either npm or bun can invoke scripts when compatible.

## Frameworks

**Core:**

- **SvelteKit** (^2.50.2) — routing, `$app/*` imports, build pipeline (`@sveltejs/kit`).
- **Svelte** (^5.54.0) — UI with runes (`svelte.config.js` enables runes for app code).
- **Vite** (^7.3.1) — bundler and dev server (`vite.config.ts`).

**Adapter / deployment shape:**

- **`@sveltejs/adapter-static`** (^3.0.10) — static output; `svelte.config.js` uses `adapter({ fallback: 'index.html' })` and `prerender: { handleUnseenRoutes: 'ignore' }` for SPA-style hosting.

**Testing:**

- **Vitest** (^4.1.0) — unit/integration tests; config embedded in `vite.config.ts` with two projects:
  - **client**: browser mode via `@vitest/browser-playwright` + Chromium for `src/**/*.svelte.{test,spec}.{js,ts}`.
  - **server**: `environment: 'node'` for `src/**/*.{test,spec}.{js,ts}` excluding Svelte browser tests.
- **Playwright** (^1.58.2) — E2E (`playwright.config.ts`: `testMatch: '**/*.e2e.{ts,js}'`, web server `npm run build && npm run preview` on port 4173).

**Build / Dev:**

- **@tailwindcss/vite** (^4.1.18) + **tailwindcss** (^4.1.18) — styling; plugins in `src/routes/layout.css`: `@tailwindcss/forms`, `@tailwindcss/typography`.
- **typescript-eslint**, **eslint** (^10), **eslint-plugin-svelte** — linting (`eslint.config.js`).
- **prettier** + **prettier-plugin-svelte** + **prettier-plugin-tailwindcss** — formatting (`.prettierrc`).
- **svelte-check** — type/check pipeline (`package.json` script `check`).

## Key Dependencies

**Critical (runtime, shipped app):**

- **dexie** (^4.4.2) — IndexedDB wrapper; schema in `src/lib/adapters/persistence/dexie/schema.ts`, repositories under `src/lib/adapters/persistence/dexie/`.
- **marked** (^18.0.0) — Markdown to HTML in `src/lib/components/MarkdownContent.svelte`.
- **shiki** (^4.0.2) — syntax highlighting in `src/lib/components/CodeBlock.svelte` (`createHighlighter`, themes/langs configured in component).

**Infrastructure (tooling):**

- **@sveltejs/vite-plugin-svelte** — bridges Svelte + Vite.
- **@types/node** — Node typings for config and tests.

## Configuration

**Environment:**

- No `import.meta.env` or `process.env` usage under `src/` for app configuration — the app does not depend on build-time public env vars for core behavior.
- `.env` files: not enumerated here; if present, treat as local-only (see project `.gitignore`).

**Build:**

- `svelte.config.js` — Kit + adapter-static + Svelte compiler runes.
- `vite.config.ts` — plugins: `tailwindcss()`, `sveltekit()`; Vitest projects and browser test includes/excludes.
- `tsconfig.json` — extends `.svelte-kit/tsconfig.json`; strict TypeScript, `moduleResolution: "bundler"`.
- `playwright.config.ts` — E2E webServer and test file pattern.

## Platform Requirements

**Development:**

- Node.js compatible with Vite 7, Vitest 4, Playwright 1.58, and SvelteKit 2 (use current LTS; no `engines` field or `.nvmrc` in repo).
- **bun** recommended for install/scripts per project docs.
- Chromium (bundled with Playwright) for Vitest browser tests and Playwright E2E.

**Production:**

- **Static file hosting** — output is a prerendered/client SPA suitable for any static host (CDN, object storage + HTTPS, GitHub Pages, etc.); no server-side API routes (`+server.ts` not present).

---

*Stack analysis: 2026-04-09*
