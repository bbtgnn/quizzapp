## done: false

## Parent PRD

prds/classroom-quiz-app/index.md

## What to build

Build the code highlighter component: a self-contained Svelte component that accepts a code string, a language, and an optional highlight range (start/end line, or character range within a line), and renders the code with syntax highlighting and a visual highlight overlay on the specified range.

Use Shiki for syntax highlighting (as recommended in the PRD). The component must work in a static SvelteKit build (no server-side rendering dependency).

## Acceptance criteria

- [ ] Shiki is installed and configured for browser-side use
- [ ] A `CodeBlock` Svelte component accepts props: `code: string`, `language: string`, `highlight?: { startLine: number, endLine: number }` (line numbers are 1-indexed)
- [ ] The component renders syntax-highlighted code
- [ ] When `highlight` is provided, the specified line range is visually distinguished (e.g. background color overlay)
- [ ] The component handles missing/undefined `highlight` gracefully (renders without overlay)
- [ ] The component is usable standalone (can be dropped into any route)
- [ ] At least one visual smoke test or Playwright screenshot test verifies the highlight renders on the correct lines

## Blocked by

None — can start immediately.

## User stories addressed

- User story 18
