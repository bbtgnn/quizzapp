# Phase 4: Live session run UI - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the **live session run experience** so participants see **shared stem/context** (when present), the **current step**, and **k-of-n progression** that reflects **`SessionEngine`** state; each step is answered with **open**, **multiple-choice**, or **true-false** as defined; the UI **must not** hold a separate authoritative step index. For this milestone slice, **visual layout and teacher interaction patterns stay as the current run page** unless a plan task explicitly requires a minimal fix for UI-01–UI-03 compliance.

</domain>

<decisions>
## Implementation Decisions

### Layout & structure (shared stem vs step)
- **D-01:** **Keep the existing run UI layout** — no redesign of how shared content, step prompt, and answer region are ordered and grouped for Phase 4.

### Code snippet & per-step ranges
- **D-02:** **Defer** wiring **per-step `range`** into shared `code-snippet` presentation (e.g. `CodeBlock` highlight driven by the current step’s `range` only). **Not in scope for Phase 4 planning** unless a later gap review shows UI-01/UI-02 cannot be met without it; track under Deferred Ideas.

### Step progression (k-of-n)
- **D-03:** **Keep** the current **compact “Step k of n”** (and related header copy) tied to engine-backed `currentStepIndex` / `totalSteps` — no new progress bar or step-dot UI required for Phase 4.

### Open-answer grading
- **D-04:** **Keep** existing **keyboard-first** grading for open questions (**1/C**, **2/P**, **3/W**) and the current footer hint copy; **no requirement** to add on-screen Correct / Partial / Wrong buttons for Phase 4.

### Engine authority (reaffirmed)
- **D-05:** Run route continues to render **only** from `SessionEngine` getters for current question, current step, and progress — **no** parallel authoritative step index in the UI (aligns Phase 3 context).

### Claude's Discretion
- Minor Tailwind/copy tweaks that do not change the decisions above.
- Any technical adjustment strictly required to satisfy **UI-01–UI-03** while keeping D-01–D-04.

### Folded Todos

_None._

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap
- `.planning/REQUIREMENTS.md` — **UI-01**, **UI-02**, **UI-03**
- `.planning/ROADMAP.md` — Phase 4 goal and success criteria
- `.planning/PROJECT.md` — product constraints and milestone intent

### Prior phase context
- `.planning/phases/03-session-engine-aggregate-scoring/03-CONTEXT.md` — engine as sole step/progress authority; attempt/skip semantics
- `.planning/phases/01-domain-model-import-contract/01-CONTEXT.md` — logical question, shared + steps, per-step `range` for code (deferred in UI per D-02)

### Code (run UI integration)
- `src/routes/sessions/[id]/run/+page.svelte` — live run page; bind to engine state only
- `src/lib/domain/session-engine/index.ts` — authoritative `currentStep`, `currentStepIndex`, `totalSteps`
- `src/lib/components/CodeBlock.svelte` — code presentation (per-step range wiring deferred per D-02)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- **`SessionEngine`** — exposes `currentStudent`, `currentQuestion`, `currentStep`, `currentStepIndex`, `totalSteps`, `progress`; run page already derives display state from these.
- **`CodeBlock`**, **`MarkdownContent`** — shared content rendering for code-snippet vs markdown.

### Established patterns
- Run page uses **`$derived`** from engine + `tick` to stay in sync after async outcomes; no local step counter.
- Teacher grading for open answers via **window keydown**; MC/TF via buttons.

### Integration points
- **`+page.svelte`** load data → construct **`SessionEngine`** with **`sessionEnginePersistence`** — unchanged pattern.

</code_context>

<specifics>
## Specific Ideas

- User confirmed: **keep current UI** for layout, k-of-n, and open grading; **explicitly skip** per-step code `range` / `CodeBlock` emphasis work for now.

</specifics>

<deferred>
## Deferred Ideas

- **Per-step code emphasis for shared `code-snippet`:** Drive highlights from **step `range`** (Phase 1 model) and drop reliance on shared-level `highlight` when the product is ready — **not part of Phase 4** per discussion (D-02).

### Reviewed Todos (not folded)

_None._

</deferred>

---

*Phase: 04-live-session-run-ui*
*Context gathered: 2026-04-10*
