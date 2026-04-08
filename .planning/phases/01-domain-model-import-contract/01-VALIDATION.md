---
phase: 1
slug: domain-model-import-contract
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 |
| **Config file** | `vite.config.ts` (server project: `src/**/*.{test,spec}.{js,ts}`) |
| **Quick run command** | `bun run test:unit -- --run src/lib/importer/` |
| **Full suite command** | `bun run test:unit -- --run` then `bun run test` (adds e2e) |
| **Estimated runtime** | ~30–120 seconds (project-dependent) |

---

## Sampling Rate

- **After every task commit:** `bun run test:unit -- --run src/lib/importer/`
- **After every plan wave:** `bun run test:unit -- --run`
- **Before `/gsd-verify-work`:** Full suite green (`bun run test` if e2e is standard)
- **Max feedback latency:** ~120 seconds for full `bun run test`

---

## Per-Task Verification Map

Aligned with plan frontmatter: Plan **01** wave **1**; Plans **02** and **03** waves **2** and **3** (sequential: 02 before 03); Plan **04** wave **4**.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| per 01-01-PLAN | 01 | 1 | MODL-01, MODL-02 | — | N/A | unit | `bun run test:unit -- --run src/lib/importer/` (schemas) | ⬜ W0 | ⬜ pending |
| per 01-02-PLAN | 02 | 2 | IMPT-01 | T-5-01 (input validation) | Reject invalid JSON before persist | unit | `bun run test:unit -- --run src/lib/importer/index.test.ts` | Partial | ⬜ pending |
| per 01-03-PLAN | 03 | 3 | IMPT-02 | — | N/A | script + manual diff | `bun run scripts/migrate-question-sets.ts` (per plan) | ❌ W0 | ⬜ pending |
| per 01-04-PLAN | 04 | 4 | IMPT-02, D-13 | — | N/A | unit + CI | `bun run test:unit -- --run` + `question-sets.validation.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add **`zod`** dependency (`bun add zod`)
- [ ] Extend `src/lib/importer/index.test.ts` (or add schemas test file) for new envelope + strict key rejection
- [ ] Add bundled JSON validation covering `question-sets/**/*.json` (D-13) — test or `scripts/validate-question-sets.ts`
- [ ] Optional: GitHub Actions workflow if D-13 is enforced in CI

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Author UX of import errors | IMPT-01 | UI copy | Import invalid JSON in dev; confirm single path + reason string |

---

## Nyquist Dimensions

| Dimension | Covered by |
|-----------|------------|
| Automated regression | Vitest importer + question-sets checks |
| Security (V5 input validation) | Zod strict + tests for reject paths |

---

*Derived from `01-RESEARCH.md` § Validation architecture — 2026-04-09*
