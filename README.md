# YT Bookmarks

A Chrome extension for bookmarking YouTube videos at specific timestamps. Save moments with notes, search and sort your collection, and export/import bookmarks as JSON.

## Features

- Bookmark the current timestamp on any YouTube video
- Add optional notes to each bookmark
- Keyboard shortcut: **Alt+B** to bookmark instantly
- Search, sort, and browse bookmarks grouped by video
- Export and import bookmarks as JSON
- Badge count shows total bookmarks

## Install

1. Clone or download this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `dist` folder

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
