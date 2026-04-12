---
phase: 06
slug: design-foundation-ui-primitives
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
note: "Automated component tests are introduced in plan 02 task 06-02-03 (not a separate Wave 0 plan file). Set wave_0_complete and nyquist_compliant after that task is green."
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution (from RESEARCH.md § Validation Architecture).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.x + @vitest/browser-playwright |
| **Config file** | `vite.config.ts` (`test.projects`) |
| **Quick run command** | `bun run test:unit -- --run --project client` |
| **Full suite command** | `bun run test:unit -- --run` then `bun run check` |
| **Estimated runtime** | ~60–120 seconds (full); client subset faster |

---

## Sampling Rate

- **After every task commit:** `bun run test:unit -- --run --project client` scoped to touched `*.svelte.spec.ts` + `bun run check` when Svelte/types change
- **After every plan wave:** Full unit run + `bun run check`
- **Before `/gsd-verify-work`:** Full suite green; `bun run build` green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | TOK-01 | T-06-01 / — | Motion / contrast tokens | build | `bun run build` | ⬜ | ⬜ pending |
| 06-01-02 | 01 | 1 | TOK-01 | T-06-02 / — | N/A | build | `bun run build` | ⬜ | ⬜ pending |
| 06-01-03 | 01 | 1 | TOK-01 | T-06-01 / — | Reduced-motion | build | `bun run build` | ⬜ | ⬜ pending |
| 06-02-01 | 02 | 2 | CMP-01 | — / — | Focus ring, variant distinction | typecheck | `bun run check` | ⬜ | ⬜ pending |
| 06-02-02 | 02 | 2 | CMP-01 | — / — | Card vs elevated surfaces | typecheck | `bun run check` | ⬜ | ⬜ pending |
| 06-02-03 | 02 | 2 | CMP-01 | — / — | a11y name + min target | browser | `bun run test:unit -- --run --project client src/lib/components/Button.svelte.spec.ts src/lib/components/Panel.svelte.spec.ts` | ⬜ | ⬜ pending |
| 06-03-01 | 03 | 3 | TOK-01, CMP-01 | — / — | Lab composition | check+build | `bun run check && bun run build` | ⬜ | ⬜ pending |
| 06-03-02 | 03 | 3 | TOK-01, CMP-01 | D-16 / D-17 | Cursor + motion prefs | build | `bun run build` | ⬜ | ⬜ pending |
| 06-03-03 | 03 | 3 | TOK-01, CMP-01 | — / — | Doc traceability | grep | `rg -q TOK-01 docs/design-tokens.md` (etc.) | ⬜ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

- [ ] **06-02-03** creates `Button.svelte.spec.ts` + `Panel.svelte.spec.ts` (full tests per plan — not empty stubs)
- [ ] Short token doc **`docs/design-tokens.md`** via **06-03-03**

*Treat Wave 0 as satisfied when 06-02-03’s client Vitest run is green and both spec files exist.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Style-lab visuals | TOK-01, CMP-01 | Pixel/contrast judgment | Open style-lab route; verify stage, card, answer colors, button variants, type roles |
| Reduced motion | D-13, D-18 | OS preference | Enable `prefers-reduced-motion`; stage calms; no confetti/shake in demos |
| Coarse pointer | D-16 | Device | Emulate touch; custom cursor must not break usability |
| Keyboard focus | CMP-01 | Human spot-check | Tab through controls; visible focus ring |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
