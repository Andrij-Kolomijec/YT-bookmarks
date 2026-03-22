# YT Bookmarks

A browser extension for bookmarking YouTube videos at specific timestamps. Works in Chrome and Firefox. Save moments with notes, search and sort your collection, and export/import bookmarks as JSON.

## Features

- Bookmark the current timestamp on any YouTube video
- Add optional notes to each bookmark
- Keyboard shortcut: **Alt+B** to bookmark instantly
- Saves playback speed per bookmark and restores it when opened
- Configurable rewind offset so bookmarks open a few seconds earlier (default 5s)
- Auto-delete bookmarks when a video ends (optional, off by default)
- Search, sort, and browse bookmarks grouped by video
- Export and import bookmarks as JSON
- Badge count shows total bookmarks

## Install

### Chrome

1. Clone or download this repo
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `dist` folder

### Firefox

1. Clone or download this repo
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on...**
4. Select `dist/manifest.json`

> Firefox temporary add-ons are removed when the browser closes. Requires Firefox 121+.

The `dist` folder contains a pre-built extension ready to use. To build from source:

```sh
pnpm install
pnpm build
```

## Development

```sh
pnpm dev     # start Vite dev server
pnpm lint    # run Biome linter
pnpm format  # auto-format with Biome
```

---

Built with the help of [Claude Opus 4.6](https://claude.ai/) by Anthropic.
