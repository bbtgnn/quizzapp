---
phase: 06
slug: design-foundation-ui-primitives
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
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
| 06-01-01 | 01 | 1 | TOK-01 | T-06-01 / — | N/A (tokens) | build + browser | `bun run build` | ✅ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | CMP-01 | T-06-02 / — | Focus visible; destructive distinct | browser | `bun run test:unit -- --run --project client` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/components/Button.svelte.spec.ts` — stubs for CMP-01 (role, label, min hit area where asserted)
- [ ] `src/lib/components/Panel.svelte.spec.ts` (or combined lab smoke) — TOK-01 composition
- [ ] Short token/application doc per roadmap (path in plan)

*Wave 0 completes when stub tests exist and first green run is recorded.*

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
