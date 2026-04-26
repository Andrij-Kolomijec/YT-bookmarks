# YT Bookmarks

A browser extension for bookmarking YouTube videos at specific timestamps. Works in Chrome and Firefox. Save moments with notes, search and sort your collection, and export/import bookmarks as JSON.

## Features

- Bookmark the current timestamp on any YouTube video
- Add optional notes to each bookmark
- Keyboard shortcut: **Alt+B** (Mac: **Ctrl+Cmd+B**) to bookmark instantly — customizable via `chrome://extensions/shortcuts`
- Saves playback speed per bookmark and restores it when opened
- Configurable rewind offset so bookmarks open a few seconds earlier (default 5s)
- Auto-delete bookmarks when a video reaches the end (optional, off by default)
- Open bookmark links in the current tab or a new tab (configurable)
- Search, sort, and browse bookmarks grouped by video
- Expand/collapse all bookmark groups at once
- Export and import bookmarks as JSON
- Auto-opens My Bookmarks when not on a YouTube page
- Badge count shows total bookmarks

## Install

### Chrome

1. Download the latest `yt-bookmarks-*.zip` from [Releases](https://github.com/Andrij-Kolomijec/YT-bookmarks/releases) and unzip it.
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the unzipped folder

To build from source instead

```sh
pnpm install
pnpm build
```

Then load the `dist` folder as described above.

### Firefox

1. Download the latest `yt-bookmarks-*.xpi` from [Releases](https://github.com/Andrij-Kolomijec/YT-bookmarks/releases).

## Development

```sh
pnpm dev     # start Vite dev server
pnpm lint    # run Biome linter
pnpm format  # auto-format with Biome
```
