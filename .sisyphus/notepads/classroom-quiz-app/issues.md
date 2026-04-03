# Issues & Gotchas

## [2026-04-03] Session start

- showDirectoryPicker not available in Firefox/Safari — need browser compat warning
- Shiki must be configured for browser-side use (no Node.js APIs)
- adapter-static means no server-side load functions that touch DB — all DB access must be client-side
