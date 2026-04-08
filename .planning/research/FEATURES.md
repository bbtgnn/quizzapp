# Feature Research

**Domain:** Live classroom quiz app (browser-only, teacher-led sessions, **multi-step single logical question** replacing chain-linked rows)  
**Product:** Quizzapp (see `.planning/PROJECT.md`)  
**Researched:** 2026-04-09  
**Confidence:** **HIGH** for behaviors explicitly aligned with `PROJECT.md` / codebase; **MEDIUM** for cross-tool UX norms (web synthesis, not primary-user research)

## Feature Landscape

### Table Stakes (Users Expect These)

Behaviors teachers and students expect when **one drawn item** can contain **several steps** in a **live** setting. Missing these makes multi-step items feel broken compared to single questions or compared to how chains behaved today.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **One unit in the session deck** | A multi-step item consumes **one** “question” in the teacher’s mental model and in selection/turn logic—not N separate pool entries tied together. | MEDIUM | Core milestone goal: replace `chain_parent_id` / `chain_order` rows with one `Question` containing steps. |
| **Clear step progression** | Students know where they are (e.g. step *k* of *n*) and what to answer now; reduces anxiety and mistaken double-submit. | LOW–MEDIUM | UI affordance; must align with `SessionEngine` “current step” state if steps are advanced explicitly. |
| **Shared stem / context across steps** | When the design is “read this once, answer several prompts,” the **code block, image, or stem** stays stable while prompts or highlight regions change. | MEDIUM | Matches PROJECT.md examples (code + multiple highlight ranges + per-step prompts). |
| **Per-step answer modality** | Each step accepts the same **family** of types the app already supports (open, MC, TF)—not a single global type for the whole item. | MEDIUM | Already a stated requirement; importer + run UI must respect per-step discriminated unions. |
| **Aggregate outcome for the attempt** | One persisted result for the **whole** item: `correct` / `partial` / `wrong` from the combination of step results. | MEDIUM | Already in model (`Attempt.outcome`); rules: all correct → correct; all wrong → wrong; mix → partial (PROJECT.md). |
| **Teacher-trustworthy scoring rule** | The partial rule is **predictable** (“some right, some wrong”) without hidden weighting—matches “fair, understandable live quizzes” core value. | LOW | v1 explicitly **no** per-step weights (see Anti-Features). |

### Differentiators (Competitive Advantage)

Not every classroom tool combines **live orchestration**, **local-first** operation, and **rich text/code with highlight-linked sub-prompts** in one item. These are where Quizzapp can stand out *if* executed cleanly—without matching full LMS breadth.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Code + highlight-scoped prompts in one item** | Supports CS / technical subjects: one snippet, multiple “what does this line do?” moments without re-importing duplicate content. | MEDIUM–HIGH | Different from generic “multi-part” forms that are prose-only or page-break based. |
| **Mixed interaction types inside one logical question** | A short open response, then a TF check, then MC—pedagogically one task, technically one pool object. | MEDIUM | Uncommon in simple gamified quiz UIs that assume one widget type per screen. |
| **Local-first live sessions** | Runs in the classroom without accounts or server sync; data stays on device (aligned with existing product). | N/A (existing) | Differentiator vs SaaS quiz platforms; **not** part of this milestone’s scope expansion. |
| **Hexagonal session core** | `SessionEngine` + strategies stay testable as step model grows—reduces regression risk when adding steps. | MEDIUM (maintain) | Developer-facing quality that enables faster iteration on multi-step UX later. |

### Anti-Features (Deliberately NOT in v1)

Items that are tempting for “assessment completeness” but conflict with **PROJECT.md** constraints, explode scope, or undermine the **single aggregate outcome** story.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Per-step partial credit / weights** | “Line 1 is worth more than line 2.” | Requires new schema, UI, and teacher mental load; contradicts v1 three-outcome aggregate. | Ship **uniform** steps + `partial` = any split; defer weights to a later milestone if needed. |
| **Step-level attempt history as first-class reporting** | Drill-down analytics per sub-prompt. | Dexie model and teacher UI grow quickly; not required to validate the new question shape. | v1: store what’s needed to compute aggregate; optional minimal debug or future export. |
| **Branching steps (answer A unlocks different step B)** | Adaptive paths inside one item. | Session state machine, authoring format, and testing complexity jump; easy to ship bugs in live flow. | Keep **linear** step list for v1; use separate questions in the pool if branching is needed. |
| **Full authoring UI redesign** | “Make the editor WYSIWYG for every step layout.” | Out of scope per PROJECT.md unless minimally required for import/testing. | JSON-first + minimal UI to author/test; polish editor later. |
| **Silent auto-advance with no teacher visibility** | Feels “faster.” | Live classes need **pacing control** and predictable “who is on what”; conflicts with teacher-led session model. | Explicit advance / clear engine transitions consistent with current run page patterns. |
| **Backward-compatible IndexedDB migration from old chain rows** | Users might have old data. | PROJECT.md: **Dexie wipe OK**; bundled JSON migration in-repo only. | Document wipe; re-import bundled sets. |
| **Server sync, accounts, multi-device continuity** | Homework / take-home. | Explicitly out of scope; distracts from nailing local live multi-step. | Stay client-only until product direction changes. |

## Feature Dependencies

```
[Single logical Question with steps]
    └──requires──> [Step schema + discriminated content/answer per step]
                       └──requires──> [Importer + bundled JSON shape]
    └──requires──> [SessionEngine: one slot, multi-step progression]
                       └──requires──> [Run UI: stem + current step + submit/advance]
    └──requires──> [Aggregate scoring → Attempt.outcome]
                       └──requires──> [Per-step correctness evaluation (existing type handlers)]

[Shared code stem + highlight ranges]
    └──requires──> [Stable render of stem + per-step highlight metadata]
    └──enhances──> [Clear step progression] (students map highlight ↔ prompt)

[Teacher pacing / engine transitions]
    └──conflicts──> [Silent auto-advance without visibility] (same phase: pick one model)
```

### Dependency Notes

- **Single logical `Question` requires step schema:** Without a typed nested structure, chain-style rows reappear under another name.
- **SessionEngine multi-step requires UI alignment:** Engine state and run page must agree on “current step” and when an attempt row is written (per item vs per step—product decision: **one attempt per logical item** with aggregate outcome matches PROJECT.md).
- **Aggregate scoring requires per-step evaluation:** Reuse existing open/MC/TF evaluation; no new rubric engine in v1.
- **Shared stem + highlights** depends on **content model** carrying both global content and step-local overlays (ranges + prompts).

## MVP Definition

### Launch With (v1)

Minimum to replace chains and satisfy core value (“one clear unit, possibly several steps”).

- [ ] **One `Question` entity** holds ordered steps; no `chain_parent_id` / `chain_order` for new format — essential.
- [ ] **Importer + bundled `question-sets/`** migrated to new JSON — essential for shipping.
- [ ] **Live run flow** presents stem + step *k* of *n*, accepts answers per existing types — essential.
- [ ] **Aggregate `correct` | `partial` | `wrong`** persisted on `Attempt` — essential.
- [ ] **Linear step order** only — essential to cap scope.

### Add After Validation (v1.x)

Once multi-step items work in real sessions.

- [ ] **Richer step templates** in authoring UI — trigger: teachers ask for faster than JSON editing.
- [ ] **Step-level visibility in session review** (read-only which steps missed) — trigger: formative feedback need; keep aggregate as source of truth.
- [ ] **Duplicate / clone step** in editor — trigger: repetitive code-highlight patterns.

### Future Consideration (v2+)

- [ ] **Weighted or rubric-based partials** — defer until aggregate partial is proven insufficient.
- [ ] **Branching or conditional steps** — defer until linear multi-step is stable and authored sets demand it.
- [ ] **Cloud sync / accounts** — product direction change, not a feature of this milestone.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Single logical question + linear steps | HIGH | MEDIUM | P1 |
| Aggregate three outcomes | HIGH | LOW–MEDIUM | P1 |
| Mixed answer types per step | HIGH | MEDIUM | P1 |
| Shared stem + per-step highlights | HIGH | MEDIUM–HIGH | P1 |
| JSON import + bundled migration | HIGH | MEDIUM | P1 |
| Step progress UI (“k of n”) | MEDIUM | LOW | P1 |
| Per-step analytics / reporting | MEDIUM | HIGH | P3 |
| Branching steps | MEDIUM | HIGH | P3 |
| Weighted partial credit | LOW (for v1) | HIGH | P3 |

**Priority key:**

- P1: Must have for milestone launch  
- P2: Should have when possible (not blocking chain replacement)  
- P3: Nice to have / future  

## Competitor Feature Analysis

*Interpretation:* Classroom tools differ on **live vs async**, **question richness**, and **granularity of scoring**. The matrix is directional—**MEDIUM confidence** without vendor feature audits.

| Feature | Kahoot-style live MC | Forms / quiz builders (async) | Our Approach (Quizzapp) |
|---------|---------------------|---------------------------------|-------------------------|
| Multi-part in one “slide” | Often **one interaction per screen**; sequences are separate questions | Sections / pages; not same as live turn-taking | **One pool item**, multiple steps inside, teacher-led session |
| Partial credit on composite item | Typically **per-question** scoring, not fine-grained multi-blank | Can score per section; not live engine | **Single aggregate** `partial` for v1 |
| Code + line-level prompts | Uncommon in mainstream templates | Possible via add-ons; not live-local | **First-class** in milestone vision (JSON + renderer) |
| Accounts / cloud | Expected | Expected | **Explicit non-goal** for v1 |

## Sources

- **PRIMARY (HIGH confidence):** `.planning/PROJECT.md` (requirements, out of scope, key decisions)  
- **PRIMARY (HIGH confidence):** `.planning/codebase/ARCHITECTURE.md` — `SessionEngine`, Dexie, attempt outcomes, import path  
- **SECONDARY (MEDIUM confidence):** General classroom quiz / formative-assessment product patterns (live feedback, clarity of progression)—synthesized from public positioning of tools such as [Kahoot! schools](https://kahoot.com/schools/) and common UX expectations for multi-step tasks; **not** a substitute for user interviews with target teachers  

---
*Feature research for: Quizzapp — multi-step single question milestone*  
*Researched: 2026-04-09*
