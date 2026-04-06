# Technology Stack

**Analysis Date:** 2026-04-07

## Languages

**Primary:**

- TypeScript (~5.9) — Application code under `src/`, config files
- Svelte 5 — UI in `src/**/*.svelte` with runes enabled for app code (`svelte.config.js`)

**Secondary:**

- JavaScript — `svelte.config.js`, `eslint.config.js`, `playwright.config.ts` (ESM)

## Runtime

**Environment:**

- **Browser** — Client-only app: `src/routes/+layout.ts` sets `ssr = false` and `prerender = true` with `@sveltejs/adapter-static` and SPA fallback `index.html`
- **Node.js** — Dev server (Vite), build, tests, lint (typical 18+; align with local/tooling)

**Package Manager:**

- Project docs (`CLAUDE.md`, `AGENTS.md`) specify **bun**; `package.json` scripts use `npm run` for some commands — use one consistently in CI and locally

## Frameworks

**Core:**

- **SvelteKit** (^2.50) — Routing, layouts, `+page.svelte` / `+layout.svelte`, `$lib` alias
- **Vite** (^7.3) — Dev and build via `@sveltejs/vite-plugin-svelte`

**UI / styling:**

- **Tailwind CSS** (^4.1) — `@tailwindcss/vite`, `@tailwindcss/forms`, `@tailwindcss/typography`

**Testing:**

- **Vitest** (^4.1) — Unit tests (`**/*.test.ts`, `**/*.spec.ts` under `src/`)
- **@vitest/browser-playwright** / **vitest-browser-svelte** — Component tests in browser mode where used
- **Playwright** (^1.58) — E2E (`**/*.e2e.{ts,js}`), e.g. `src/routes/demo/playwright/page.svelte.e2e.ts`

**Build / quality:**

- **svelte-check** — `npm run check`
- **ESLint 10** + **typescript-eslint** + **eslint-plugin-svelte**
- **Prettier 3** + **prettier-plugin-svelte** + **prettier-plugin-tailwindcss**

## Key Dependencies

**Critical:**

- **dexie** (^4.4) — IndexedDB wrapper; schema in `src/lib/db/schema.ts` (`QuizAppDB`), app data is fully client-side
- **shiki** (^4.0) — Syntax highlighting (e.g. `src/lib/components/CodeBlock.svelte`)

**Adapter:**

- **@sveltejs/adapter-static** — Static export + SPA fallback for client-side routing

## Configuration

**Environment:**

- No server-side secrets in-repo for the static SPA; any future API keys would be client-visible unless proxied — design accordingly

**Build:**

- `svelte.config.js` — `adapter-static`, `prerender.handleUnseenRoutes: 'ignore'`, runes for non-`node_modules` Svelte
- `vite.config.ts` — Vite + Svelte + Tailwind
- `tsconfig.json` — TypeScript project references / strictness for SvelteKit

## Platform Requirements

**Development:**

- Modern browser for IndexedDB; Node for tooling

**Production:**

- Static hosting (any CDN or static file server); app is a **pre-rendered shell + client-side navigation** with data in the user’s browser (IndexedDB)

---

*Stack analysis: 2026-04-07*  
*Update after major dependency changes*
