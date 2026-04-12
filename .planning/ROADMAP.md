# Roadmap: Quizzapp

## Milestones

- ✅ **v1.0 Multi-step questions** — Phases 1–5 — shipped 2026-04-12 — [archived roadmap](milestones/v1.0-ROADMAP.md) · [archived requirements](milestones/v1.0-REQUIREMENTS.md)
- 🚧 **v1.1 Quiz show UI** — Phases 6–10 — in progress (**funnel + run only**)

## Overview

**v1.1** applies a **game / quiz show** look—**saturated color**, **large controls**, **expressive type**, **juicy motion**—to the **main path**: **classroom selection → question set selection → live run**.

**Teacher management** (new classroom, student lists, import wizard, sessions index, history, settings, etc.) stays **visually simple**; no dedicated quiz-show pass in this milestone.

## Phases

- [ ] **Phase 6: Design foundation & UI primitives** — **TOK-01, CMP-01**: Tailwind/theme tokens, typography scale, primary/secondary buttons, panels/cards for reuse on funnel + run.
- [ ] **Phase 7: Funnel shell & classroom selection** — **SHL-01, FUN-01**: Framing for in-scope routes; quiz-show **`/`** (classroom list / pick teaching context).
- [ ] **Phase 8: Question set selection** — **FUN-02**: **`/sessions/new`** and **`/question-sets`** list; import route stays baseline.
- [ ] **Phase 9: Live session run** — **RUN-01**: **`/sessions/[id]/run`** — big staging, oversized answer controls, engine-true k-of-n/stem.
- [ ] **Phase 10: Motion & polish (in-scope)** — **MOT-01, POL-01**: Transitions/micro-interactions + readable errors/loading/notices and responsive check on funnel + run.

## Phase Details

### Phase 6: Design foundation & UI primitives

**Goal**: Shared **visual system** for funnel and run screens.

**Depends on**: v1.0 complete

**Requirements**: TOK-01, CMP-01

**Success criteria**:

1. Theme **tokens** (background, surface, primary/secondary/accent, semantic colors, radii) usable from utilities.
2. **Typography** roles for display / title / body / label.
3. **Button** + **panel** primitives proven on a small pilot surface.
4. Short **docs** on applying tokens.

**Plans:** 3 plans

Plans:

- [x] 06-01-PLAN.md — TOK-01: `@theme` tokens, typography `@utility` roles, `html` 112.5%, CSS stage motion + reduced-motion fallback in `layout.css`
- [ ] 06-02-PLAN.md — CMP-01: `Button.svelte` + `Panel.svelte` + Vitest browser specs
- [ ] 06-03-PLAN.md — `/style-lab` pilot (tokens + primitives + D-16/D-17 demos) + `docs/design-tokens.md`

### Phase 7: Funnel shell & classroom selection

**Goal**: **Shell** and **`/`** feel like a quiz show **without** restyling full management.

**Depends on**: Phase 6

**Requirements**: SHL-01, FUN-01

**Success criteria**:

1. Funnel/run routes use quiz-show **frame** (background, header rhythm) per SHL-01; management pages may stay plain or lightly inherit tokens only.
2. **`/`** classroom list / selection is fully on-brand (big tiles or list, clear CTA to continue the path).

**Plans:** TBD

### Phase 8: Question set selection

**Goal**: **Pick sets and start** feels like part of the show.

**Depends on**: Phase 7

**Requirements**: FUN-02

**Success criteria**:

1. **`/sessions/new`** — classroom dropdown, set multi-select, counts/strategy — uses large controls and funnel styling.
2. **`/question-sets`** — browse/list aligned with funnel (import page excluded from quiz-show requirements).

**Plans:** TBD

### Phase 9: Live session run

**Goal**: **Run** is the climax: game-show energy, **engine-only** progression.

**Depends on**: Phase 8

**Requirements**: RUN-01

**Success criteria**:

1. Stem, step, **k-of-n** legible at a glance; oversized answer actions.
2. **No** new step authority; same getters/state as today.
3. Outcome/skip visuals match the new palette where shown.

**Plans:** TBD

### Phase 10: Motion & polish (in-scope)

**Goal**: **Juice** + guardrails on **funnel + run**.

**Depends on**: Phase 9

**Requirements**: MOT-01, POL-01

**Success criteria**:

1. Motion on key funnel/run interactions; **`prefers-reduced-motion`** honored.
2. Loading/error paths on in-scope routes readable; upgrade banner at least **contrast-safe**.
3. Responsive check for funnel + run (no broken saturated layouts on narrow widths).

**Plans:** TBD

## Progress

**Execution order:** 6 → 7 → 8 → 9 → 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 6. Design foundation & UI primitives | v1.1 | 0/3 | Not started | — |
| 7. Funnel shell & classroom selection | v1.1 | 0/TBD | Not started | — |
| 8. Question set selection | v1.1 | 0/TBD | Not started | — |
| 9. Live session run | v1.1 | 0/TBD | Not started | — |
| 10. Motion & polish (in-scope) | v1.1 | 0/TBD | Not started | — |
