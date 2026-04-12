---
phase: 4
slug: live-session-run-ui
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Research was skipped for this phase; strategy is aligned with `04-01-PLAN.md` and existing Vitest infrastructure.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (`vite.config.ts` `test` block) |
| **Config file** | `vite.config.ts` |
| **Quick run command** | `bun run test:unit -- --run src/lib/domain/session-engine/session-engine.test.ts` |
| **Full suite command** | `bun run check` then `bun run test:unit -- --run` |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** `bun run check` and targeted unit file from the plan `<verify>` block
- **After plan wave 1:** `bun run test:unit -- --run src/lib/domain/session-engine/session-engine.test.ts` + `bun run check`
- **Before `/gsd-verify-work`:** Full unit run green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | UI-01 | T-04-01 | Engine exposes shared + step + k-of-n data N/A to XSS here | unit | `bun run test:unit -- --run src/lib/domain/session-engine/session-engine.test.ts` | ✅ | ⬜ pending |
| 04-01-02 | 01 | 1 | UI-02 / UI-03 | T-04-01 / T-04-03 | No new trust boundary; static + typecheck | static | `bun run check` + `rg` criteria in plan | ✅ | ⬜ pending |

---

## Wave 0 Requirements

- Existing Vitest + `bun run check` cover this phase; no Wave 0 install task.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Classroom readability of k-of-n and stem | UI-01 | Visual/regression not in CI | Open a session run with a multi-step logical question; confirm stem + step + Step k of n match engine. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or documented manual row
- [x] Sampling continuity: tasks use automated commands
- [x] No watch-mode flags in CI commands
- [x] Frontmatter `nyquist_compliant: true`

**Approval:** pending execution
