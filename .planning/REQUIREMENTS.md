# Requirements: Quizzapp — v1.1 Quiz show UI

**Defined:** 2026-04-12  
**Core Value:** Teachers can run fair, understandable live quizzes where each drawn item is one clear unit—possibly several steps—without a separate chain-question concept complicating the model, import format, or session logic.

## v1.1 Requirements

Scoped to **visual design, layout, and motion** on the **main teaching path** only:

**Classroom selection → question set selection → live run.**

Functional behavior stays as v1.0; SessionEngine remains authoritative on the run screen.

### Visual language & tokens

- [ ] **TOK-01**: A **cohesive quiz-show / game UI** theme is defined as **design tokens** (color roles, radii, shadows, spacing) and applied through **Tailwind theme extension** or equivalent so funnel screens compose shared utilities.

### Components & density

- [ ] **CMP-01**: **Primary actions** on **in-scope routes** use **large, high-visibility** button styles (minimum touch target and typographic weight documented in implementation); secondary/tertiary styles remain distinguishable.

### Funnel shell

- [ ] **SHL-01**: **Layout and framing** for the **funnel + run** (`/`, `/question-sets`, `/sessions/new`, `/sessions/[id]/run`, plus shared root chrome as needed) matches the quiz-show aesthetic. **Management routes** (see Out of Scope) may remain visually plain; shell may **degrade gracefully** or **skip** heavy styling there if implementation uses one layout.

### Funnel: classroom selection

- [ ] **FUN-01**: **Classroom selection** is quiz-show styled — primarily **`/`** (classroom list / choosing where to teach). **Creating/editing classrooms and managing students** is **not** part of this requirement.

### Funnel: question set selection

- [ ] **FUN-02**: **Question set selection** on the path to a live session is quiz-show styled: **`/sessions/new`** (classroom + multi-select sets + start) and **`/question-sets`** (browse/list for context before import or start). **Import JSON** (`/question-sets/import`) stays **simple / baseline** styling unless trivial token alignment.

### Live session experience

- [ ] **RUN-01**: **Live session run** (`/sessions/[id]/run`) is restyled for **quiz-show energy** while **still reflecting SessionEngine state only** (no duplicate step authority).

### Motion & feedback

- [ ] **MOT-01**: **Purposeful motion** on **in-scope routes**; **`prefers-reduced-motion`** respected (instant or minimal animation fallback).

### Polish (in-scope surfaces)

- [ ] **POL-01**: **Errors, loading, and global notices** that appear during the funnel or run are **readable** on saturated backgrounds; **responsive** pass for **in-scope** pages. **Upgrade / IndexedDB notice** in root layout: at minimum **readable contrast**; full quiz-show treatment optional if shared with out-of-scope pages.

## v2 Requirements

Deferred after v1.1.

### Broader styling

- **MGT-01**: Quiz-show pass on **full teacher management** (classroom detail, students, import wizard, sessions list, history, settings).

### Product depth

- **AUTH-01**: Rich in-app authoring for multi-step templates beyond JSON-first workflows.  
- **ANLY-01**: First-class per-step reporting or analytics surfaces.

### Advanced assessment

- **ADVN-01**: Weighted or rubric-based partial credit per step.  
- **ADVN-02**: Branching or conditional steps inside one logical question.

### Sensory

- **AUD-01**: Optional sound effects and audio feedback for quiz-show pacing.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server sync, accounts, multi-device | Unchanged product direction |
| Changing SessionEngine scoring or step rules | v1.1 is visual layer only |
| New question types or import schema | Deferred |
| **Quiz-show styling for management / secondary routes** | v1.1 scope: funnel + run only — e.g. `classrooms/new`, `classrooms/[id]` (student CRUD), `question-sets/import`, `sessions` list (non-new), `history`, `settings`, `demo` — remain **simple** unless unavoidable shared layout |
| Full JSON authoring redesign | Deferred |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOK-01 | Phase 6 | Pending |
| CMP-01 | Phase 6 | Pending |
| SHL-01 | Phase 7 | Pending |
| FUN-01 | Phase 7 | Pending |
| FUN-02 | Phase 8 | Pending |
| RUN-01 | Phase 9 | Pending |
| MOT-01 | Phase 10 | Pending |
| POL-01 | Phase 10 | Pending |

**Coverage:**

- v1.1 requirements: 8 total  
- Mapped to phases: 8  
- Unmapped: 0

---
*Requirements defined: 2026-04-12*  
*Last updated: 2026-04-12 — funnel-only scope (classroom → sets → run)*
