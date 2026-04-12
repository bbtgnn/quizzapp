# Requirements: Quizzapp — v1.1 Quiz show UI

**Defined:** 2026-04-12  
**Core Value:** Teachers can run fair, understandable live quizzes where each drawn item is one clear unit—possibly several steps—without a separate chain-question concept complicating the model, import format, or session logic.

## v1.1 Requirements

Scoped to **visual design, layout, and motion**. Functional behavior of sessions and logical questions remains as shipped in v1.0 unless a change is strictly presentational.

### Visual language & tokens

- [ ] **TOK-01**: A **cohesive quiz-show / game UI** theme is defined as **design tokens** (color roles, radii, shadows, spacing) and applied through **Tailwind theme extension** or equivalent so new screens do not invent one-off palettes.

### Components & density

- [ ] **CMP-01**: **Primary actions** use **large, high-visibility** button styles (minimum touch target and typographic weight documented in implementation); secondary/tertiary styles remain distinguishable.

### App shell

- [ ] **SHL-01**: **Global chrome** (root layout, navigation, page framing) matches the quiz-show aesthetic—no default “plain gray” shell remains in scope.

### Teacher management surfaces

- [ ] **RTE-01**: All **primary teacher flows** are restyled: home or entry, **classrooms**, **students**, **question sets** (import/list/detail), **sessions** (create/configure/list), and **settings** — including lists, forms, and empty states.

### Live session experience

- [ ] **RUN-01**: **Live session run** UI is restyled for **quiz-show energy** (bold staging, oversized answer controls, clear k-of-n progression) while **still reflecting SessionEngine state only** (no duplicate step authority).

### Motion & feedback

- [ ] **MOT-01**: **Purposeful motion** improves feedback (transitions, button press, panel reveals) and **respects `prefers-reduced-motion`** (fallback to instant or minimal animation).

### Polish

- [ ] **POL-01**: **Edge UI** matches the theme: **errors**, **loading**, **upgrade / notice banners**, and **responsive** layouts down to mobile widths without broken layouts on saturated backgrounds.

## v2 Requirements

Deferred after v1.1.

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
| New question types or import schema | Deferred to future milestones |
| Full redesign of JSON authoring model | Out of scope; lists/forms may be styled only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOK-01 | Phase 6 | Pending |
| CMP-01 | Phase 6 | Pending |
| SHL-01 | Phase 7 | Pending |
| RTE-01 | Phase 8 | Pending |
| RUN-01 | Phase 9 | Pending |
| MOT-01 | Phase 10 | Pending |
| POL-01 | Phase 10 | Pending |

**Coverage:**

- v1.1 requirements: 7 total  
- Mapped to phases: 7  
- Unmapped: 0

---
*Requirements defined: 2026-04-12*  
*Last updated: 2026-04-12 after v1.1 milestone start*
