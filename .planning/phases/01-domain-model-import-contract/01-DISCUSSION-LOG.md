# Phase 1: Domain model & import contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `01-CONTEXT.md`.

**Date:** 2026-04-09
**Phase:** 1 — Domain model & import contract
**Areas discussed:** Step discriminant & JSON shape; Zod boundary; Highlight / shared code; Bundled migration

---

## Area 1 — Step discriminant & JSON shape

**User input:** Prefer authoring model **one code snippet + array of `{ range, question }`**.

**Resolution:** Encode as **`shared.content`** = `code-snippet` with **language + code only** (no shared highlight), and **`steps[]`** with **`range`**, **`text`** (maps to “question”), and **`answer`**. Top-level file keeps **`name`**, **`schemaVersion`**, **`questions[]`** of logical units.

---

## Area 2 — Zod boundary behavior

**User choice:** **ok** (strict Zod, path-based errors, `schemaVersion` on file, TS aligned with Zod).

---

## Area 3 — Highlight / shared code

**User input:** Overlaps Area 1 — **no shared highlight**; **only shared code**; emphasis is **per step** via **`range`**.

**Resolution:** Shared `code-snippet` omits highlight; each step carries **`range`** when shared content is code; markdown (or non-code) steps omit **`range`**.

---

## Area 4 — Bundled migration

**User choice:** **ok** (in-place migration script, both legacy shapes, optional `referenceAnswer` for open, CI coverage).

---

## Claude's Discretion

- JSON alias `question` → `text` if we want author-ergonomics vs single field name in schema.

## Deferred Ideas

_None recorded._
