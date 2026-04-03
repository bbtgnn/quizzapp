# Decisions

## [2026-04-03] Session start

- Dexie.js chosen for IndexedDB (TypeScript-first, schema migrations, good query API)
- Shiki chosen for syntax highlighting (accurate, browser-compatible, many languages)
- Repository pattern for DB layer — no business logic in DB module
- Pluggable strategy pattern for both question selection and student ordering
- Strategy registry maps string IDs to strategy instances
- Session config is immutable once created
- Outcomes: correct | partial | wrong (raw, stored for future spaced repetition)
- Question chains: single slot, all-correct rule, follow-ups always asked
- File format: folder of JSON files, one per snippet
