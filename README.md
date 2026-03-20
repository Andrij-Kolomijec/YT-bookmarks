# YT Bookmarks

A Chrome extension for bookmarking YouTube videos at specific timestamps. Save moments with notes, search and sort your collection, and export/import bookmarks as JSON.

## Features

- Bookmark the current timestamp on any YouTube video
- Add optional notes to each bookmark
- Keyboard shortcut: **Alt+B** to bookmark instantly
- Search, sort, and browse bookmarks grouped by video
- Export and import bookmarks as JSON
- Badge count shows total bookmarks

## Setup

```sh
pnpm install
pnpm build
```

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist` folder

## Development

```sh
pnpm dev     # start Vite dev server
pnpm lint    # run Biome linter
pnpm format  # auto-format with Biome
```
