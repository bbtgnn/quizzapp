# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@0.13.2 create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" playwright tailwindcss="plugins:typography,forms" sveltekit-adapter="adapter:static" mcp="ide:claude-code,cursor+setup:remote" --install bun ./
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Local persistence upgrade behavior

This milestone introduces a Dexie v3 schema cutover for persisted questions.

- IndexedDB wipe: browser-local IndexedDB data may be reset after the upgrade.
- no migration: chain-era persisted rows are not migrated to the new logical-question shape.
- Recovery path: if local question sets are missing after upgrade, re-import your JSON files.

## Sessions, pause, and resume

VER-03: During a live session, **SessionEngine** can pause and resume progress on the **current multi-step question** when persisted session state restores **`active_unit_progress`**—you stay on the same logical unit and step after a reload or when returning to a paused session.

**Limitations:** Clearing site data or an IndexedDB upgrade wipe removes local session state, so in-progress units cannot be resumed from the browser alone. Importing a backup with an unsupported version is rejected (no legacy backup migration); see backup errors in Settings. Closing the browser before state is written to IndexedDB may lose the latest progress—treat the app as persisted only after Dexie writes complete.
