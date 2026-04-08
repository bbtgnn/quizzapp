# Pitfalls Research

**Domain:** Interactive assessment / live quiz session engines (browser-only, IndexedDB, multi-step units)  
**Researched:** 2026-04-09  
**Confidence:** HIGH for codebase-specific scoring and engine behavior; MEDIUM for general IndexedDB/Dexie ecosystem patterns (verified against Dexie docs themes + GitHub discussions)

## Critical Pitfalls

### Pitfall 1: Carrying forward “any wrong ⇒ aggregate wrong” when the product wants “mixed ⇒ partial”

**What goes wrong:**  
Session logic continues to use a rule like “if any step is `wrong`, the whole unit is `wrong`.” Teachers and analytics then see **`wrong` where the spec calls for `partial`** (some steps right, some wrong). Conversely, implementing “partial” using only step-level `partial` outcomes and **ignoring** mixes of `correct` and `wrong` loses the new aggregate meaning.

**Why it happens:**  
The current engine’s chain aggregation is exactly: all `correct` → `correct`; **if any outcome is `wrong` → `wrong`**; else → `partial` (see `_computeChainOutcome` in `session-engine/index.ts`). That matches existing tests (e.g. “chain with one wrong → aggregate wrong” even when later steps are `correct`). The upcoming milestone explicitly changes the rule to **mixed correct and wrong → `partial`**, which is a **semantic break** from today’s implementation—not a bugfix.

**How to avoid:**  
- Define a **single truth table** (all correct / all wrong / mixed / presence of `partial`) and implement it in one function used by both engine and tests.  
- **Rewrite** chain-era tests that encode the old “one wrong dominates” rule; add matrix tests for every combination the product cares about.  
- If `partial` at step level and “mixed” at unit level interact, document precedence (e.g. does any step `partial` still force unit `partial`?).

**Warning signs:**  
New tests still assert `wrong` for “two correct, one wrong”; UI copy says “partial” but persisted `Attempt.outcome` is `wrong`; teacher-facing summaries disagree with per-step review.

**Phase to address:**  
**Session engine & scoring** (aggregate rules + attempts); **verification** phase with explicit UAT matrix for outcomes.

---

### Pitfall 2: Splitting one logical unit into multiple persisted questions without adjusting slots and selection

**What goes wrong:**  
Steps become separate `Question` rows (or separate pool entries). The engine or selector treats each row as **one slot**, so a single “logical” item consumes **N slots**, or **N attempts** are written for one teacher-facing question. Alternatively, **selection** picks step 2 before step 1, or repeats a root id across turns incorrectly.

**Why it happens:**  
Today, only the **root** `question_id` is stored on `Attempt`; the chain is in-memory (`_chainQuestions`, `_chainIndex`). Replacing chains with a new shape is easy to model as “more rows in the DB” without re-threading **one attempt per logical unit** and **one slot per unit**.

**How to avoid:**  
Keep **one consumer-facing draw = one slot** and **one final `Attempt` per unit** unless the product explicitly changes that. Centralize “expand unit → ordered steps” in one place (engine or adapter) so selectors still see **roots** only. Add tests for `n_questions_per_student` vs multi-step units.

**Warning signs:**  
Session completes after fewer “questions” than expected; `attempts` row count ≫ teacher’s notion of questions; progress bar jumps multiple segments per “question.”

**Phase to address:**  
**Session engine & question selection**; **live session UI** (progress must match slot semantics).

---

### Pitfall 3: UI step state diverging from engine state (index, completion, “current step”)

**What goes wrong:**  
The UI keeps its own `currentStepIndex`, local form state, or “revealed” flags while the engine advances `_chainIndex` / `currentQuestion` or the new equivalent. After re-render, pause/resume, or async `recordOutcome`, the UI shows **the wrong step**, allows **double submit**, or **skips** validation on a step. `chainProgress` today is derived from engine-private fields; a parallel copy in the UI will drift.

**Why it happens:**  
Svelte (or any) local state is convenient; the engine is authoritative for turn order. Without a **single source of truth** or a strict “dumb view” pattern, two graphs of “where we are” diverge.

**How to avoid:**  
Drive step UI from **engine-exposed state** (or a thin store synced only via engine methods). Reset ephemeral UI when `currentQuestion` or unit id changes. Debounce or disable submit while `recordOutcome` is in flight.

**Warning signs:**  
Progress indicator (e.g. “Step 2 of 3”) disagrees with content; console shows outcomes recorded out of visual order; rare flashes of wrong step after navigation.

**Phase to address:**  
**Live session UI**; pair with **E2E or component tests** that simulate multi-step flows.

---

### Pitfall 4: In-memory multi-step state lost on pause / resume or page reload

**What goes wrong:**  
A student is mid-unit; the teacher pauses or refreshes. The engine reconstructs from **persisted** `Session` + `SessionStudent` + `Attempt`s but **cannot** restore “on step 2 of 3” if that was never persisted. Resume starts at the **wrong step** or **re-asks** completed steps.

**Why it happens:**  
Chain state is currently **not** in IndexedDB—only outcomes that have been committed. Paused sessions re-order students but do not serialize partial chains (see constructor paths for `paused` vs `active`).

**How to avoid:**  
Either **persist** minimal “in-flight unit” state (student id + unit id + step index + version) in `Session`/`SessionStudent` or define product rule: **pause always completes or abandons the current unit** (simpler but UX cost). Document which guarantees the milestone provides.

**Warning signs:**  
Repro: pause mid-chain → resume → first screen is root again or skip ahead; attempts count doesn’t match steps shown.

**Phase to address:**  
**Session lifecycle & persistence**; explicit **UAT** for pause/resume with multi-step units.

---

### Pitfall 5: IndexedDB/Dexie: schema drift, index misuse, and “wipe” assumptions

**What goes wrong:**  
`Question` shape changes (remove `chain_parent_id` / `chain_order`, add nested steps) but **stores** still index old fields or miss new query paths. Queries return **empty** or **stale** shapes. Backup/import (e.g. versioned JSON) **rejects** or **silently drops** fields. Multiple tabs: one tab runs new code after upgrade, another old code → **VersionError** or inconsistent reads. Relying on “we’ll wipe” **without** bumping version or clearing dev databases leaves developers chasing phantom bugs.

**Why it happens:**  
Dexie indexes only what you declare; non-indexed fields are still stored but **you can’t query them efficiently**. IndexedDB **cannot downgrade** version; rollbacks in git don’t roll back browser DB version ([Dexie limitations](https://dexie.org/docs/The-Main-Limitations-of-IndexedDB), [version downgrade discussion](https://github.com/dexie/Dexie.js/issues/1599)).

**How to avoid:**  
Bump `version()` when stores/indexes change; document **dev procedure**: clear site data or delete DB after schema work. Align **backup format version** with importer. Use `versionchange` / reload strategy for multi-tab if you ship schema updates often ([Dexie `versionchange`](https://dexie.org/docs/Dexie/Dexie.on.versionchange)).

**Warning signs:**  
`undefined` where nested steps expected; import works in dev but fails in CI; “works after hard refresh”; different behavior across tabs.

**Phase to address:**  
**Dexie schema & repositories**; **bundled JSON migration** (validate against new types before import).

---

### Pitfall 6: Migration scripts that look correct but drop or flatten nested structure

**What goes wrong:**  
Repo `question-sets/*.json` is migrated from `chain` arrays to inline steps. Scripts **duplicate** shared content, **lose** ordering, or map **parent + children** to steps with **wrong** `chain_order`. Validation passes JSON Schema but **semantic** ordering is wrong in the app.

**Why it happens:**  
One-off scripts are under-tested; edge cases (single-step “chains”, mixed answer types per step) are easy to mishandle.

**How to avoid:**  
Round-trip tests: old fixture → migrate → **invariants** (step count, order, answer types). Spot-check in UI. Keep a **small** frozen before/after corpus in tests.

**Phase to address:**  
**Bundled data migration**; **import validation** phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Two parallel models (chain + steps) behind flags | Ship incrementally | Double maintenance, inconsistent scoring | Very short transition; delete branch quickly |
| Store per-step outcomes only in UI memory | No schema change | No audit trail, pause/resume bugs | Never if sessions must be reviewable |
| “Wipe Dexie” without automated dev reset | Skip migration code | Flaky local repro, confused contributors | Only with documented `clear` script / README for devs |
| Reuse `Attempt` for each step | Simpler persistence | Breaks slot + analytics; contradicts one-unit mental model | Never for this product direction |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Backup JSON import (`version` field) | Export after migration doesn’t bump format version | Keep **format version** and importer checks in sync with `PROJECT.md` |
| Dexie upgrade hooks | Long async in `.upgrade()` without transaction discipline | Keep upgrades short; see Dexie guidance on transactions ([limitations](https://dexie.org/docs/The-Main-Limitations-of-IndexedDB)) |
| Question selectors / strategies | Filtering on `chain_parent_id === null` left as dead code path | Remove or replace with “root unit” predicate in one module |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading full question sets into memory per turn | Jank on large sets | Lazy load by set id; avoid duplicating nested step blobs per render | Large imports / many steps |
| Re-querying IndexedDB every `recordOutcome` | UI lag | Batch reads; keep hot path in memory for active session | Many students or rapid clicks |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Importing bundled JSON without validation | Malformed or oversized payloads crash tab | Schema validation + size limits at import |
| Logging full question content in production | Accidental PII in snippets | Redact in logs; local-first still needs care in shared machines |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Labeling mixed performance as “wrong” | Teachers misread student understanding | Align labels with `correct` / `partial` / `wrong` definitions in PROJECT |
| Progress shows steps but slots are per unit | Feels like “double length” | One progress model: either per unit or per step, explained consistently |
| No visible “partial” explanation | Confusion when some steps green, some red | Short legend or recap screen before advancing |

## "Looks Done But Isn't" Checklist

- [ ] **Aggregation:** Every combination of step outcomes maps to the documented unit outcome (including **mixed correct/wrong → partial** per milestone).
- [ ] **Attempts:** Exactly one `Attempt` per completed unit (unless spec changes), `question_id` pointing at stable unit id.
- [ ] **Slots:** `question_slots_remaining` decrements once per unit, not per step.
- [ ] **Paused session:** Resuming never leaves engine and UI on different steps (or product explicitly “restart unit”).
- [ ] **Dexie:** New indexes queried as intended; dev wipe / version bump documented.
- [ ] **Bundled JSON:** All in-repo sets migrated; CI fails if a set is invalid.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong aggregate rule shipped | MEDIUM | Feature-flag or patch `_computeChainOutcome` equivalent; backfill analytics only if stored wrong |
| Schema half-migrated | HIGH | User `deleteDatabase` / clear site data; re-import bundled sets |
| UI/engine desync | LOW–MEDIUM | Single-source-of-truth refactor; add integration test |

## Pitfall-to-Phase Mapping

Suggested ownership for this milestone (names may match your roadmap):

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Mixed vs wrong aggregation (#1) | Session engine & scoring | Unit tests matrix + manual UAT on edge combinations |
| Slots / attempts / selection (#2) | Engine + question selection | Session engine tests with multi-step units; slot counts |
| UI step state (#3) | Live session UI | Component/E2E: multi-step, async outcome |
| Pause/resume mid-unit (#4) | Session lifecycle persistence | Explicit pause mid-unit scenario |
| Dexie / wipe / version (#5) | Persistence layer | Fresh profile + upgrade path smoke test |
| Bundled migration correctness (#6) | JSON migration + validation | Scripted diff or invariant tests on fixtures |

## Sources

- **Codebase:** `src/lib/domain/session-engine/index.ts` (`_computeChainOutcome`, `recordOutcome`, `_pickQuestion`), `src/lib/domain/session-engine/session-engine.test.ts` (chain aggregation cases), `src/lib/adapters/persistence/dexie/schema.ts`
- **Product:** `.planning/PROJECT.md` (aggregate scoring, wipe, multi-step goals)
- **Dexie / IndexedDB:** [Dexie — main limitations of IndexedDB](https://dexie.org/docs/The-Main-Limitations-of-IndexedDB), [GitHub — version downgrade / rollback](https://github.com/dexie/Dexie.js/issues/1599), [Dexie — versionchange](https://dexie.org/docs/Dexie/Dexie.on.versionchange)

---
*Pitfalls research for: quiz question-model refactor (chains → flexible steps, Dexie, SessionEngine)*  
*Researched: 2026-04-09*
