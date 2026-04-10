# Phase 5: Verification, export & lifecycle - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `05-CONTEXT.md`.

**Date:** 2026-04-10
**Phase:** 5 — Verification, export & lifecycle
**Areas discussed:** Automated verification strategy, Backup/export parity, Pause/resume documentation, Export/import testing

---

## Automated verification strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest-first (SessionEngine + mocks) | Extend `session-engine.test.ts` (or adjacent); matrix + core progression | ✓ |
| Playwright-first for run UI | E2E regression on run page | |
| Mixed (Vitest + Playwright baseline) | Broader coverage, more maintenance | |

**User's choice:** Do the recommended approach — **Vitest-first** around `SessionEngine` and existing mock repos; **no default Playwright** for Phase 5 unless a gap requires it.

**Notes:** Aggregate scoring matrix (correct / partial / wrong) and core step progression are in scope for VER-01.

---

## Backup/export parity (old backups)

| Option | Description | Selected |
|--------|-------------|----------|
| Ignore old backups | No migration; reject unsupported backup `version` | ✓ |
| Support legacy backup versions | Migration or import transforms | |

**User's choice:** **Ignore old backups** — no compatibility work; unsupported versions fail import with clear messaging (aligned with current `version === 2` gate).

---

## Pause/resume documentation

| Option | Description | Selected |
|--------|-------------|----------|
| README section + settings pointer | Central doc + short link from settings | ✓ |
| README only | No UI pointer | |
| In-app long-form only | Duplicated copy in settings | |

**User's choice:** **Recommended** — README section on pause/resume/limitations + **brief pointer** from settings (export/import context).

---

## Export/import testing

| Option | Description | Selected |
|--------|-------------|----------|
| Round-trip Vitest (minimal fixture) | At least one test proving restore preserves logical questions | ✓ |
| Manual / ad hoc only | No automated backup test | |

**User's choice:** **Recommended** — at least **one** automated round-trip or equivalent test for backup consistency (VER-02).

---

## Claude's Discretion

- Exact backup JSON `version` integer after any contract change.
- Test file layout and helper extraction for assertions.

## Deferred Ideas

- Optional Playwright for Phase 5 only if unit tests cannot close a UI traceability gap.
