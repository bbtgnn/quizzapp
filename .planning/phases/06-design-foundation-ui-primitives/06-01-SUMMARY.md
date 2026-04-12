---
phase: 06-design-foundation-ui-primitives
plan: 01
subsystem: ui
tags: [tailwind-v4, design-tokens, css, nunito, a11y]

requires: []
provides:
  - "@theme semantic colors, spacing, radii, shadow-panel, font-display"
  - "Four text-role-* typography utilities and 112.5% html root scale"
  - ".stage-quiz-show animated backdrop with prefers-reduced-motion fallback"
affects: [06-02-button-panel, 06-03-style-lab]

tech-stack:
  added: []
  patterns:
    - "Single source of theme truth in src/routes/layout.css via Tailwind v4 @theme"
    - "Google Fonts @import for Nunito 400/600 only (documented tradeoff vs self-host)"

key-files:
  created: []
  modified:
    - src/routes/layout.css

key-decisions:
  - "Loaded Nunito via fonts.googleapis.com CSS @import (plan-allowed alternative to self-host)."

patterns-established:
  - "Quiz-show tokens map to utilities (bg-stage, bg-answer-a, etc.)."
  - "Display/title use --font-display; body/label use system UI stack."

requirements-completed: [TOK-01]

duration: 25min
completed: 2026-04-12
---

# Phase 06 Plan 01: TOK-01 layout.css foundation

**Tailwind v4 `@theme` quiz-show palette, spacing, elevation, Nunito-backed display roles, global 112.5% rem scale, and a CSS-only `.stage-quiz-show` grid motif with reduced-motion fallback.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments

- Semantic stage/card/primary/destructive and four answer-slot colors as theme tokens
- Typography roles `text-role-display|title|body|label` per 06-UI-SPEC numerics
- Stage wrapper class with looping grid drift disabled under `prefers-reduced-motion: reduce`

## Task Commits

1. **Task 06-01-01: @theme semantic colors + spacing/radius/shadow** — `3292d23`
2. **Task 06-01-02: Nunito, html 112.5%, four @utility roles** — `2928f0f`
3. **Task 06-01-03: stage backdrop motion + reduced-motion** — `1f8d0b9`

## Files Created/Modified

- `src/routes/layout.css` — TOK-01 tokens, base scale, typography utilities, stage shell

## Decisions Made

- Used Google Fonts `@import` for Nunito weights 400 and 600 only, as permitted by the plan when self-hosting is deferred.

## Deviations from Plan

None — plan executed as written.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Plan 06-02 can import token-backed utilities (`bg-primary`, `rounded-[var(--radius-panel)]`, etc.)

## Self-Check: PASSED

---
*Phase: 06-design-foundation-ui-primitives*
*Completed: 2026-04-12*
