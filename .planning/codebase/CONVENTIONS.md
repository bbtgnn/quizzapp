# Coding Conventions

**Analysis Date:** 2026-04-07

## Language and modules

- **TypeScript** with **ES modules** (`"type": "module"` in `package.json`)
- **Svelte 5 runes** enabled for application Svelte files (`svelte.config.js` `compilerOptions.runes`)
- **Imports** — Use `$lib/...` for app code (`src/lib`), `.js` extensions in imports where TypeScript resolves to emitted ESM (SvelteKit convention), e.g. `'$lib/db/types.js'`

## Formatting and lint

- **Prettier** — Primary formatter; Svelte and Tailwind plugins keep component markup and class order consistent
- **ESLint** — Flat config (`eslint.config.js`): `@eslint/js`, `typescript-eslint` recommended, `eslint-plugin-svelte` recommended, Prettier conflict rules off
- **Rule note:** `no-undef` is off for TS projects (per typescript-eslint guidance in config comment)

## Naming

- **Routes:** SvelteKit conventions — `+page.svelte`, `+layout.svelte`, dynamic `[id]/`
- **Tests:** `*.test.ts`, `*.spec.ts` near or under `src/lib/`; E2E `*.e2e.ts`
- **Repositories:** `src/lib/db/repositories/<domain>.ts` — functions operating on Dexie tables

## Svelte patterns

- Prefer **runes** (`$state`, etc.) in new components for local UI state
- Keep **side effects** (DB writes) in explicit functions/async handlers, not scattered in implicit reactive statements unless justified

## Error handling

- Async repository and engine methods use **standard Promise/async-await**; surface errors to UI where user-facing failures matter (import, session run)

## Accessibility and UI

- Tailwind for layout/styling; forms plugin available — prefer semantic HTML and labels on new forms

---

*Conventions analysis: 2026-04-07*
