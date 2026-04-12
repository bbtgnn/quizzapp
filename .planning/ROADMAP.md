# Roadmap: Quizzapp

## Milestones

- ✅ **v1.0 Multi-step questions** — Phases 1–5 — shipped 2026-04-12 — [archived roadmap](milestones/v1.0-ROADMAP.md) · [archived requirements](milestones/v1.0-REQUIREMENTS.md)
- 🚧 **v1.1 Quiz show UI** — Phases 6–10 — in progress

## Overview

**v1.1** restyles the entire app toward a **game / quiz show** look: **saturated color**, **large tactile controls**, **expressive type**, and **juicy** motion—with **reduced-motion** support and **no change** to SessionEngine authority on the run screen.

## Phases

- [ ] **Phase 6: Design foundation & UI primitives** — Quiz-show **tokens** (TOK-01) and **shared components** (CMP-01): theme wiring in Tailwind, typography scale, primary/secondary buttons, panels/cards.
- [ ] **Phase 7: App shell & navigation** — **Global layout** (SHL-01): nav, page frame, background treatment, consistent header/footer rhythm.
- [ ] **Phase 8: Teacher management surfaces** — Restyle **RTE-01** routes: entry, classrooms, students, question sets, sessions, settings (lists, forms, empty states).
- [ ] **Phase 9: Live session run** — **RUN-01**: run route and participant-facing panels; big answer controls; k-of-n and stem presentation match engine state with quiz-show staging.
- [ ] **Phase 10: Motion, feedback & polish** — **MOT-01** transitions/micro-interactions + **POL-01**: errors, loading, upgrade banner, responsive pass on saturated layouts.

## Phase Details

### Phase 6: Design foundation & UI primitives

**Goal**: Establish the **visual system** so later phases compose shared primitives instead of ad-hoc styles.

**Depends on**: v1.0 complete (functional baseline)

**Requirements**: TOK-01, CMP-01

**Success criteria** (what must be TRUE):

1. **Theme tokens** exist for background, surface, primary/secondary/accent, success/warn/danger, and border radii—consumable from Svelte/Tailwind utilities.
2. **Typography scale** is defined for display / title / body / label roles used across the app.
3. **At least two button variants** (primary + secondary) and a **panel/card** primitive exist and are used in a **small pilot** refactors (e.g. one page or storybook-style demo route) to prove integration.
4. **Documentation** in README or `docs/` (short) explains how to apply tokens for new UI.

**Plans:** (to be created via `/gsd-plan-phase 6`)

### Phase 7: App shell & navigation

**Goal**: The **frame** of the app feels like a quiz show product, not a default starter template.

**Depends on**: Phase 6

**Requirements**: SHL-01

**Success criteria**:

1. Root **layout** and shared navigation use the new shell styles (background, nav placement, active states).
2. No remaining “plain” global chrome in scope routes once phases 7–8 complete (phase 7 delivers shell; phase 8 completes inner pages).

**Plans:** (TBD)

### Phase 8: Teacher management surfaces

**Goal**: Every **teacher-facing** management screen matches the new aesthetic end-to-end.

**Depends on**: Phase 7

**Requirements**: RTE-01

**Success criteria**:

1. Home/entry, classrooms, students, question sets (including import flows), sessions (list + setup), and settings use shared primitives and tokenized colors.
2. **Empty states** and **tables/lists** have intentional quiz-show styling (not default browser gray blocks).

**Plans:** (TBD)

### Phase 9: Live session run

**Goal**: **Live run** feels like a **game show** while preserving **SessionEngine** as the only authority for step index and progression.

**Depends on**: Phase 8 (shared components available)

**Requirements**: RUN-01

**Success criteria**:

1. Stem, current step, and **k-of-n** are **legible at a glance** with oversized controls for answer actions.
2. **No new source of truth** for step order; UI reads the same engine-derived state as today.
3. Visual states for correct/partial/wrong/skip (if surfaced) align with the new palette.

**Plans:** (TBD)

### Phase 10: Motion, feedback & polish

**Goal**: Add **juice** safely and close visual gaps.

**Depends on**: Phase 9

**Requirements**: MOT-01, POL-01

**Success criteria**:

1. **Motion** is applied to key interactions (route transitions or panel enter, button feedback) with **`prefers-reduced-motion`** respected.
2. **Errors, loading, and banners** (including IndexedDB upgrade notice) match the theme and remain readable.
3. **Responsive** check: no critical overlap or unreadable text on narrow viewports.

**Plans:** (TBD)

## Progress

**Execution order:** 6 → 7 → 8 → 9 → 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 6. Design foundation & UI primitives | v1.1 | 0/TBD | Not started | — |
| 7. App shell & navigation | v1.1 | 0/TBD | Not started | — |
| 8. Teacher management surfaces | v1.1 | 0/TBD | Not started | — |
| 9. Live session run | v1.1 | 0/TBD | Not started | — |
| 10. Motion, feedback & polish | v1.1 | 0/TBD | Not started | — |
