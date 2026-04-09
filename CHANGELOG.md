# Changelog

## 2026-04-09

### 02-indexeddb-persistence

- Dexie v3 schema cutover for logical question rows; chain-era data has no migration path.
- Local IndexedDB may be reset on upgrade and users may need to re-import question sets.
- Added an in-app notice to surface local reset behavior after the upgrade.
