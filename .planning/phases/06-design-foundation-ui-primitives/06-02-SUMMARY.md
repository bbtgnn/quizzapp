---
phase: 06-design-foundation-ui-primitives
plan: 02
subsystem: ui
tags: [svelte5, vitest-browser, button, panel, a11y]

requires:
  - phase: 06-01
    provides: "@theme tokens and layout.css utilities"
provides:
  - "Button.svelte with four CMP-01 variants and focus-visible rings"
  - "Panel.svelte elevated + question (card) surfaces"
  - "Browser tests with real Tailwind via spec harness importing layout.css"
affects: [06-03-style-lab]

tech-stack:
  added: []
  patterns:
    - "__spec__ harness components import src/routes/layout.css so Vitest browser mode applies theme utilities"

key-files:
  created:
    - src/lib/components/Button.svelte
    - src/lib/components/Panel.svelte
    - src/lib/components/Button.svelte.spec.ts
    - src/lib/components/Panel.svelte.spec.ts
    - src/lib/components/__spec__/ButtonCase.svelte
    - src/lib/components/__spec__/PanelCase.svelte
  modified: []

key-decisions:
  - "Vitest browser tests mount harness wrappers (ButtonCase/PanelCase) so default snippet children render; harness imports layout.css because the client project does not load SvelteKit +layout."

patterns-established:
  - "Primary button: pill, min 44×44, bg-primary; destructive rectangular with destructive token."

requirements-completed: [CMP-01]

duration: 35min
completed: 2026-04-12
---

# Phase 06 Plan 02: CMP-01 Button + Panel

**Token-backed `Button` and `Panel` primitives with Vitest browser coverage; harness components load `layout.css` so Tailwind theme utilities apply in isolated component tests.**

## Performance

- **Tasks:** 3
- **Files:** 6 created

## Task Commits

1. **06-02-01** — `4dd73bc` — Button variants
2. **06-02-02** — `bfef6bc` — Panel variants
3. **06-02-03** — `d8f09bf` — Browser specs + `__spec__` harnesses

## Deviations from Plan

### Auto-fixed Issues

**1. [Testing] Snippet children not supported via `render(Button, { children: () => '…' })`**

- **Issue:** `vitest-browser-svelte` did not render text children; buttons stayed empty.
- **Fix:** Added `ButtonCase.svelte` / `PanelCase.svelte` under `__spec__/` with real snippet content; imported `layout.css` so `min-h-[44px]` and tokens resolve (Vitest browser does not mount `+layout.svelte`).

## Issues Encountered

- Playwright browsers were missing in the environment; `bunx playwright install chromium` was required before client tests could run.

## Self-Check: PASSED

---
*Phase: 06-design-foundation-ui-primitives*
*Completed: 2026-04-12*
