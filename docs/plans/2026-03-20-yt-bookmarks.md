# YT Bookmarks Chrome Extension — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome/Firefox extension that lets users bookmark YouTube videos at specific timestamps, with full CRUD, search, grouping, export/import, notes, and keyboard shortcuts.

**Architecture:** React popup UI communicating with a content script (reads video state from YouTube DOM) via Chrome messaging API, with a background service worker as relay. All data persisted in `chrome.storage.local`. Manual Vite multi-entry build (no CRXJS).

**Tech Stack:** TypeScript, React 18, Vite 5, Biome (lint+format), pnpm, Chrome Extension Manifest V3

---

## File Structure

```
YT-bookmarks/
├── biome.json                    # Biome config (replaces .eslintrc.cjs)
├── package.json                  # Updated: pnpm, biome scripts, new deps
├── pnpm-lock.yaml                # pnpm lockfile
├── popup.html                    # Renamed from index.html (manifest references popup.html)
├── vite.config.ts                # Multi-entry: popup, background, content script
├── tsconfig.json                 # Root tsconfig
├── tsconfig.app.json             # App tsconfig (updated includes)
├── public/
│   ├── manifest.json             # Updated manifest
│   └── icons/                    # Extension icons (16, 32, 48, 128)
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       └── icon-128.png
├── src/
│   ├── shared/
│   │   ├── types.ts              # Bookmark, Message, SortOption types
│   │   ├── storage.ts            # chrome.storage.local CRUD wrapper
│   │   └── constants.ts          # Storage keys, default values
│   ├── background/
│   │   └── index.ts              # Service worker: message relay, badge updates, keyboard shortcut handler
│   ├── content/
│   │   └── index.ts              # Content script: reads video time/title/URL, responds to messages
│   └── popup/
│       ├── main.tsx              # React entry point
│       ├── App.tsx               # Root component with tab switching
│       ├── App.css               # Global popup styles
│       ├── components/
│       │   ├── BookmarkTab.tsx    # "Bookmark" tab: current video info + bookmark button
│       │   ├── TimeInput.tsx     # Editable time input (HH:MM:SS)
│       │   ├── NoteInput.tsx     # Optional note textarea
│       │   ├── ListTab.tsx       # "My Bookmarks" tab: grouped list with search/sort/delete
│       │   ├── BookmarkGroup.tsx # Collapsible group of bookmarks for one video
│       │   ├── BookmarkItem.tsx  # Single bookmark row: thumbnail, title, time, note, delete
│       │   ├── SearchBar.tsx     # Search/filter input
│       │   └── SortSelect.tsx    # Sort dropdown
│       └── hooks/
│           └── useBookmarks.ts   # Hook: load, add, delete, search, sort bookmarks
```

---

## Chunk 1: Project Setup & Tooling

### Task 1: Switch to pnpm and replace ESLint with Biome

**Files:**
- Delete: `package-lock.json`, `.eslintrc.cjs`
- Modify: `package.json`
- Create: `biome.json`

- [ ] **Step 1: Remove npm lockfile and ESLint config**

```bash
rm package-lock.json .eslintrc.cjs
```

- [ ] **Step 2: Remove ESLint dependencies and add Biome to package.json**

Update `package.json`:
- Remove from devDependencies: `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`
- Add to devDependencies: `@biomejs/biome: "^1.9.0"`
- Update scripts:
  ```json
  {
    "scripts": {
      "dev": "vite",
      "build": "tsc -b && vite build",
      "lint": "biome check .",
      "format": "biome format --write .",
      "preview": "vite preview"
    }
  }
  ```

- [ ] **Step 3: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always"
    }
  }
}
```

- [ ] **Step 4: Install with pnpm**

```bash
pnpm install
```

- [ ] **Step 5: Verify Biome works**

```bash
pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: switch to pnpm and replace ESLint with Biome"
```

---

### Task 2: Configure Vite for multi-entry Chrome extension build

**Files:**
- Modify: `vite.config.ts`
- Rename: `index.html` → `popup.html`
- Modify: `popup.html` (update script path)
- Modify: `tsconfig.app.json` (include background + content dirs)

- [ ] **Step 1: Rename `index.html` to `popup.html`**

```bash
mv index.html popup.html
```

- [ ] **Step 2: Update `vite.config.ts` for multi-entry build**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
```

- [ ] **Step 3: Update `tsconfig.app.json` include**

Change `"include": ["src"]` — this already covers all subdirectories, so no change needed. But verify it compiles the background and content dirs.

- [ ] **Step 4: Create placeholder entry files so build doesn't fail**

Create `src/background/index.ts`:
```typescript
console.log("YT Bookmarks: background service worker loaded");
```

Create `src/content/index.ts`:
```typescript
console.log("YT Bookmarks: content script loaded");
```

Update `src/popup/main.tsx` (move from `src/main.tsx`):
```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Move `src/App.tsx` → `src/popup/App.tsx` and `src/App.css` → `src/popup/App.css`.

Update `popup.html` script src to point to new location:
```html
<script type="module" src="/src/popup/main.tsx"></script>
```

Delete `src/main.tsx`, `src/index.css`.

- [ ] **Step 5: Build and verify output**

```bash
pnpm build
ls dist/
# Should contain: popup.html, popup.js, background.js, content.js, manifest.json
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "build: configure Vite multi-entry for Chrome extension"
```

---

### Task 3: Update manifest.json and add placeholder icons

**Files:**
- Modify: `public/manifest.json`
- Create: `public/icons/` (placeholder icons)

- [ ] **Step 1: Update `public/manifest.json`**

```json
{
  "name": "YT Bookmarks",
  "version": "1.0.0",
  "description": "Bookmark YouTube videos at specific timestamps",
  "permissions": ["storage", "tabs", "activeTab"],
  "host_permissions": ["https://*.youtube.com/*"],
  "commands": {
    "bookmark-current": {
      "suggested_key": {
        "default": "Alt+B",
        "mac": "Alt+B"
      },
      "description": "Bookmark current video at current time"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://*.youtube.com/*"],
      "js": ["content.js"]
    }
  ],
  "action": {
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    },
    "default_title": "YT Bookmarks",
    "default_popup": "popup.html"
  },
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "manifest_version": 3
}
```

- [ ] **Step 2: Create placeholder icons**

Use simple solid-color PNGs for now (can be replaced with real icons later). Create `public/icons/` directory with 16x16, 32x32, 48x48, 128x128 placeholder PNGs. We can generate these with a canvas script or use any bookmark icon.

Delete `public/cogwheel.svg` (unused).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: update manifest.json with commands, icons, and correct paths"
```

---

## Chunk 2: Shared Types & Storage Layer

### Task 4: Define shared types

**Files:**
- Create: `src/shared/types.ts`

- [ ] **Step 1: Create `src/shared/types.ts`**

```typescript
export interface Bookmark {
  id: string;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  channelName: string;
  thumbnailUrl: string;
  timestamp: number; // seconds
  note: string;
  createdAt: number; // Date.now()
}

export type SortOption = "newest" | "oldest" | "video" | "channel";

// Messages between popup <-> background <-> content script
export type Message =
  | { type: "GET_VIDEO_INFO" }
  | { type: "VIDEO_INFO"; data: VideoInfo | null }
  | { type: "BOOKMARK_CURRENT"; timestamp?: number }
  | { type: "BOOKMARK_CREATED"; bookmark: Bookmark };

export interface VideoInfo {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  channelName: string;
  thumbnailUrl: string;
  currentTime: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/types.ts
git commit -m "feat: add shared types for bookmarks and messages"
```

---

### Task 5: Create constants and storage layer

**Files:**
- Create: `src/shared/constants.ts`
- Create: `src/shared/storage.ts`

- [ ] **Step 1: Create `src/shared/constants.ts`**

```typescript
export const STORAGE_KEY = "yt_bookmarks";
```

- [ ] **Step 2: Create `src/shared/storage.ts`**

```typescript
import type { Bookmark, SortOption } from "./types";
import { STORAGE_KEY } from "./constants";

export async function getBookmarks(): Promise<Bookmark[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] ?? [];
}

export async function addBookmark(bookmark: Bookmark): Promise<Bookmark[]> {
  const bookmarks = await getBookmarks();
  const exists = bookmarks.some(
    (b) => b.videoId === bookmark.videoId && b.timestamp === bookmark.timestamp,
  );
  if (exists) {
    throw new Error("Bookmark already exists for this video at this timestamp");
  }
  const updated = [bookmark, ...bookmarks];
  await chrome.storage.local.set({ [STORAGE_KEY]: updated });
  return updated;
}

export async function deleteBookmark(id: string): Promise<Bookmark[]> {
  const bookmarks = await getBookmarks();
  const updated = bookmarks.filter((b) => b.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY]: updated });
  return updated;
}

export async function getBookmarksForVideo(videoId: string): Promise<Bookmark[]> {
  const bookmarks = await getBookmarks();
  return bookmarks.filter((b) => b.videoId === videoId);
}

export function sortBookmarks(bookmarks: Bookmark[], sort: SortOption): Bookmark[] {
  const sorted = [...bookmarks];
  switch (sort) {
    case "newest":
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case "oldest":
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case "video":
      return sorted.sort((a, b) => a.videoTitle.localeCompare(b.videoTitle));
    case "channel":
      return sorted.sort((a, b) => a.channelName.localeCompare(b.channelName));
  }
}

export function filterBookmarks(bookmarks: Bookmark[], query: string): Bookmark[] {
  const q = query.toLowerCase();
  return bookmarks.filter(
    (b) =>
      b.videoTitle.toLowerCase().includes(q) ||
      b.channelName.toLowerCase().includes(q) ||
      b.note.toLowerCase().includes(q),
  );
}

export function groupByVideo(bookmarks: Bookmark[]): Map<string, Bookmark[]> {
  const groups = new Map<string, Bookmark[]>();
  for (const b of bookmarks) {
    const existing = groups.get(b.videoId) ?? [];
    existing.push(b);
    groups.set(b.videoId, existing);
  }
  return groups;
}

export async function exportBookmarks(): Promise<string> {
  const bookmarks = await getBookmarks();
  return JSON.stringify(bookmarks, null, 2);
}

export async function importBookmarks(json: string): Promise<Bookmark[]> {
  const imported: Bookmark[] = JSON.parse(json);
  // Validate basic structure
  for (const b of imported) {
    if (!b.id || !b.videoId || typeof b.timestamp !== "number") {
      throw new Error("Invalid bookmark format");
    }
  }
  // Merge: keep existing, add new (by id)
  const existing = await getBookmarks();
  const existingIds = new Set(existing.map((b) => b.id));
  const newBookmarks = imported.filter((b) => !existingIds.has(b.id));
  const merged = [...newBookmarks, ...existing];
  await chrome.storage.local.set({ [STORAGE_KEY]: merged });
  return merged;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/
git commit -m "feat: add storage layer with CRUD, search, sort, export/import"
```

---

## Chunk 3: Content Script & Background Service Worker

### Task 6: Content script — read video info from YouTube DOM

**Files:**
- Modify: `src/content/index.ts`

- [ ] **Step 1: Implement content script**

```typescript
import type { Message, VideoInfo } from "../shared/types";

function getVideoInfo(): VideoInfo | null {
  const video = document.querySelector("video");
  if (!video) return null;

  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get("v");
  if (!videoId) return null;

  const titleEl = document.querySelector(
    "yt-formatted-string.style-scope.ytd-watch-metadata",
  ) as HTMLElement | null;
  const channelEl = document.querySelector(
    "ytd-channel-name yt-formatted-string a",
  ) as HTMLAnchorElement | null;

  return {
    videoId,
    videoTitle: titleEl?.textContent?.trim() ?? "Unknown Title",
    videoUrl: window.location.href.split("&")[0] ?? window.location.href,
    channelName: channelEl?.textContent?.trim() ?? "Unknown Channel",
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    currentTime: Math.floor(video.currentTime),
  };
}

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    if (message.type === "GET_VIDEO_INFO") {
      sendResponse({ type: "VIDEO_INFO", data: getVideoInfo() });
    }
    return true; // keep channel open for async response
  },
);
```

- [ ] **Step 2: Commit**

```bash
git add src/content/index.ts
git commit -m "feat: content script reads video info from YouTube DOM"
```

---

### Task 7: Background service worker — message relay, badge, keyboard shortcut

**Files:**
- Modify: `src/background/index.ts`

- [ ] **Step 1: Implement background service worker**

```typescript
import type { Bookmark, VideoInfo } from "../shared/types";
import { addBookmark, getBookmarksForVideo } from "../shared/storage";

// Update badge count for current video
async function updateBadge(tabId: number, videoId: string | null) {
  if (!videoId) {
    await chrome.action.setBadgeText({ text: "", tabId });
    return;
  }
  const bookmarks = await getBookmarksForVideo(videoId);
  const count = bookmarks.length;
  await chrome.action.setBadgeText({ text: count > 0 ? String(count) : "", tabId });
  await chrome.action.setBadgeBackgroundColor({ color: "#cc0000", tabId });
}

// Listen for tab updates to refresh badge
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("youtube.com/watch")) {
    const url = new URL(tab.url);
    const videoId = url.searchParams.get("v");
    await updateBadge(tabId, videoId);
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "bookmark-current") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.includes("youtube.com/watch")) return;

  const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_VIDEO_INFO" });
  const videoInfo: VideoInfo | null = response?.data;
  if (!videoInfo) return;

  const bookmark: Bookmark = {
    id: crypto.randomUUID(),
    ...videoInfo,
    note: "",
    createdAt: Date.now(),
    timestamp: videoInfo.currentTime,
  };

  try {
    await addBookmark(bookmark);
    await updateBadge(tab.id, videoInfo.videoId);
  } catch {
    // Already bookmarked at this timestamp — silently ignore
  }
});

// Listen for storage changes to update badge on active tab
chrome.storage.onChanged.addListener(async (changes) => {
  if (!changes.yt_bookmarks) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.includes("youtube.com/watch")) return;
  const url = new URL(tab.url);
  const videoId = url.searchParams.get("v");
  await updateBadge(tab.id, videoId);
});
```

- [ ] **Step 2: Commit**

```bash
git add src/background/index.ts
git commit -m "feat: background worker with badge updates and keyboard shortcut"
```

---

## Chunk 3: Popup UI

### Task 8: Popup hooks and main app shell

**Files:**
- Create: `src/popup/hooks/useBookmarks.ts`
- Modify: `src/popup/App.tsx`
- Modify: `src/popup/App.css`
- Modify: `src/popup/main.tsx`

- [ ] **Step 1: Create `src/popup/hooks/useBookmarks.ts`**

```typescript
import { useCallback, useEffect, useState } from "react";
import type { Bookmark, SortOption, VideoInfo } from "../../shared/types";
import {
  addBookmark,
  deleteBookmark,
  exportBookmarks,
  filterBookmarks,
  getBookmarks,
  importBookmarks,
  sortBookmarks,
} from "../../shared/storage";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");

  const load = useCallback(async () => {
    const all = await getBookmarks();
    setBookmarks(all);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Listen for storage changes (e.g., from keyboard shortcut)
  useEffect(() => {
    const listener = () => { load(); };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [load]);

  const filtered = filterBookmarks(bookmarks, search);
  const sorted = sortBookmarks(filtered, sort);

  const add = async (videoInfo: VideoInfo, timestamp: number, note: string) => {
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      ...videoInfo,
      timestamp,
      note,
      createdAt: Date.now(),
    };
    const updated = await addBookmark(bookmark);
    setBookmarks(updated);
  };

  const remove = async (id: string) => {
    const updated = await deleteBookmark(id);
    setBookmarks(updated);
  };

  const doExport = async () => {
    const json = await exportBookmarks();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "yt-bookmarks.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file: File) => {
    const text = await file.text();
    const updated = await importBookmarks(text);
    setBookmarks(updated);
  };

  return {
    bookmarks: sorted,
    search,
    setSearch,
    sort,
    setSort,
    add,
    remove,
    doExport,
    doImport,
  };
}

export function useVideoInfo() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id || !tab.url?.includes("youtube.com/watch")) {
          setVideoInfo(null);
          setLoading(false);
          return;
        }
        const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_VIDEO_INFO" });
        setVideoInfo(response?.data ?? null);
      } catch {
        setVideoInfo(null);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  return { videoInfo, loading };
}
```

- [ ] **Step 2: Create `src/popup/App.tsx` with tab navigation**

```tsx
import { useState } from "react";
import { useBookmarks, useVideoInfo } from "./hooks/useBookmarks";
import { BookmarkTab } from "./components/BookmarkTab";
import { ListTab } from "./components/ListTab";
import "./App.css";

type Tab = "bookmark" | "list";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("bookmark");
  const { videoInfo, loading } = useVideoInfo();
  const bookmarkState = useBookmarks();

  return (
    <div className="popup">
      <header className="header">
        <h1>YT Bookmarks</h1>
        <nav className="tabs">
          <button
            className={activeTab === "bookmark" ? "tab active" : "tab"}
            onClick={() => setActiveTab("bookmark")}
          >
            Bookmark
          </button>
          <button
            className={activeTab === "list" ? "tab active" : "tab"}
            onClick={() => setActiveTab("list")}
          >
            My Bookmarks ({bookmarkState.bookmarks.length})
          </button>
        </nav>
      </header>
      <main className="content">
        {activeTab === "bookmark" ? (
          <BookmarkTab
            videoInfo={videoInfo}
            loading={loading}
            onBookmark={bookmarkState.add}
          />
        ) : (
          <ListTab {...bookmarkState} />
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/popup/App.css`**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 380px;
  min-height: 400px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 13px;
  color: #1a1a1a;
  background: #fff;
}

.popup {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  padding: 12px 16px 0;
  border-bottom: 1px solid #e5e5e5;
}

.header h1 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.tabs {
  display: flex;
  gap: 0;
}

.tab {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: none;
  font-size: 13px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  color: #666;
  transition: all 0.15s;
}

.tab:hover {
  color: #1a1a1a;
}

.tab.active {
  color: #cc0000;
  border-bottom-color: #cc0000;
  font-weight: 500;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Bookmark Tab */
.bookmark-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-preview {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.video-preview img {
  width: 120px;
  height: 68px;
  border-radius: 4px;
  object-fit: cover;
}

.video-meta {
  flex: 1;
  min-width: 0;
}

.video-meta h3 {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-meta .channel {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.time-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-row label {
  font-size: 12px;
  color: #666;
}

.time-input {
  font-family: monospace;
  font-size: 14px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 90px;
  text-align: center;
}

.time-input:focus {
  outline: none;
  border-color: #cc0000;
}

.note-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
  resize: vertical;
  min-height: 36px;
  max-height: 80px;
}

.note-input:focus {
  outline: none;
  border-color: #cc0000;
}

.note-input::placeholder {
  color: #aaa;
}

.bookmark-btn {
  width: 100%;
  padding: 10px;
  background: #cc0000;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.bookmark-btn:hover {
  background: #aa0000;
}

.bookmark-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.status-msg {
  text-align: center;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-msg.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-msg.error {
  background: #fce4ec;
  color: #c62828;
}

.status-msg.info {
  color: #666;
  padding: 40px 16px;
}

/* List Tab */
.list-tab {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-controls {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.search-input:focus {
  outline: none;
  border-color: #cc0000;
}

.sort-select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  background: white;
}

.list-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 11px;
  cursor: pointer;
  color: #444;
}

.action-btn:hover {
  background: #f5f5f5;
}

.video-group {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #fafafa;
  cursor: pointer;
  border: none;
  width: 100%;
  text-align: left;
  font-size: 12px;
}

.group-header img {
  width: 48px;
  height: 27px;
  border-radius: 2px;
  object-fit: cover;
}

.group-header .group-title {
  flex: 1;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-header .group-count {
  color: #999;
  font-size: 11px;
}

.bookmark-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 20px;
  border-top: 1px solid #f0f0f0;
}

.bookmark-item .time-link {
  font-family: monospace;
  font-size: 12px;
  color: #cc0000;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
}

.bookmark-item .time-link:hover {
  text-decoration: underline;
}

.bookmark-item .note-text {
  flex: 1;
  font-size: 11px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-item .delete-btn {
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
  line-height: 1;
}

.bookmark-item .delete-btn:hover {
  color: #cc0000;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px 16px;
  font-size: 13px;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/popup/
git commit -m "feat: popup app shell with hooks, tabs, and styles"
```

---

### Task 9: BookmarkTab component (bookmark current video)

**Files:**
- Create: `src/popup/components/BookmarkTab.tsx`
- Create: `src/popup/components/TimeInput.tsx`
- Create: `src/popup/components/NoteInput.tsx`

- [ ] **Step 1: Create `src/popup/components/TimeInput.tsx`**

```tsx
import { useCallback, useEffect, useState } from "react";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseTime(str: string): number | null {
  const parts = str.split(":").map(Number);
  if (parts.some((p) => Number.isNaN(p) || p < 0)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

interface Props {
  seconds: number;
  onChange: (seconds: number) => void;
}

export function TimeInput({ seconds, onChange }: Props) {
  const [value, setValue] = useState(formatTime(seconds));

  useEffect(() => {
    setValue(formatTime(seconds));
  }, [seconds]);

  const handleBlur = useCallback(() => {
    const parsed = parseTime(value);
    if (parsed !== null && parsed >= 0) {
      onChange(parsed);
      setValue(formatTime(parsed));
    } else {
      setValue(formatTime(seconds));
    }
  }, [value, seconds, onChange]);

  return (
    <input
      className="time-input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleBlur();
      }}
    />
  );
}
```

- [ ] **Step 2: Create `src/popup/components/NoteInput.tsx`**

```tsx
interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function NoteInput({ value, onChange }: Props) {
  return (
    <textarea
      className="note-input"
      placeholder="Add a note (optional)"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
    />
  );
}
```

- [ ] **Step 3: Create `src/popup/components/BookmarkTab.tsx`**

```tsx
import { useState } from "react";
import type { VideoInfo } from "../../shared/types";
import { TimeInput } from "./TimeInput";
import { NoteInput } from "./NoteInput";

interface Props {
  videoInfo: VideoInfo | null;
  loading: boolean;
  onBookmark: (videoInfo: VideoInfo, timestamp: number, note: string) => Promise<void>;
}

export function BookmarkTab({ videoInfo, loading, onBookmark }: Props) {
  const [timestamp, setTimestamp] = useState(videoInfo?.currentTime ?? 0);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Update timestamp when videoInfo loads
  if (videoInfo && timestamp === 0 && videoInfo.currentTime > 0) {
    setTimestamp(videoInfo.currentTime);
  }

  if (loading) {
    return <div className="status-msg info">Loading...</div>;
  }

  if (!videoInfo) {
    return (
      <div className="status-msg info">
        Navigate to a YouTube video to create a bookmark.
      </div>
    );
  }

  const handleBookmark = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await onBookmark(videoInfo, timestamp, note);
      setStatus({ type: "success", msg: "Bookmark saved!" });
      setNote("");
    } catch (e) {
      setStatus({ type: "error", msg: e instanceof Error ? e.message : "Failed to save" });
    }
    setSaving(false);
  };

  return (
    <div className="bookmark-tab">
      <div className="video-preview">
        <img src={videoInfo.thumbnailUrl} alt="" />
        <div className="video-meta">
          <h3>{videoInfo.videoTitle}</h3>
          <div className="channel">{videoInfo.channelName}</div>
        </div>
      </div>
      <div className="time-row">
        <label>Time:</label>
        <TimeInput seconds={timestamp} onChange={setTimestamp} />
      </div>
      <NoteInput value={note} onChange={setNote} />
      <button
        className="bookmark-btn"
        onClick={handleBookmark}
        disabled={saving}
      >
        {saving ? "Saving..." : "Bookmark"}
      </button>
      {status && (
        <div className={`status-msg ${status.type}`}>{status.msg}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/popup/components/BookmarkTab.tsx src/popup/components/TimeInput.tsx src/popup/components/NoteInput.tsx
git commit -m "feat: BookmarkTab with editable time input and notes"
```

---

### Task 10: ListTab component (browse, search, sort, delete, export/import)

**Files:**
- Create: `src/popup/components/ListTab.tsx`
- Create: `src/popup/components/BookmarkGroup.tsx`
- Create: `src/popup/components/BookmarkItem.tsx`
- Create: `src/popup/components/SearchBar.tsx`
- Create: `src/popup/components/SortSelect.tsx`

- [ ] **Step 1: Create `src/popup/components/SearchBar.tsx`**

```tsx
interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <input
      className="search-input"
      type="text"
      placeholder="Search bookmarks..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
```

- [ ] **Step 2: Create `src/popup/components/SortSelect.tsx`**

```tsx
import type { SortOption } from "../../shared/types";

interface Props {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "video", label: "By Video" },
  { value: "channel", label: "By Channel" },
];

export function SortSelect({ value, onChange }: Props) {
  return (
    <select
      className="sort-select"
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 3: Create `src/popup/components/BookmarkItem.tsx`**

```tsx
import type { Bookmark } from "../../shared/types";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
}

export function BookmarkItem({ bookmark, onDelete }: Props) {
  const url = `${bookmark.videoUrl}&t=${bookmark.timestamp}s`;

  return (
    <div className="bookmark-item">
      <a
        className="time-link"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {formatTime(bookmark.timestamp)}
      </a>
      <span className="note-text">{bookmark.note || "—"}</span>
      <button
        className="delete-btn"
        onClick={() => onDelete(bookmark.id)}
        title="Delete bookmark"
      >
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/popup/components/BookmarkGroup.tsx`**

```tsx
import { useState } from "react";
import type { Bookmark } from "../../shared/types";
import { BookmarkItem } from "./BookmarkItem";

interface Props {
  videoTitle: string;
  thumbnailUrl: string;
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
}

export function BookmarkGroup({ videoTitle, thumbnailUrl, bookmarks, onDelete }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="video-group">
      <button className="group-header" onClick={() => setOpen(!open)}>
        <img src={thumbnailUrl} alt="" />
        <span className="group-title">{videoTitle}</span>
        <span className="group-count">{bookmarks.length}</span>
        <span>{open ? "▾" : "▸"}</span>
      </button>
      {open &&
        bookmarks.map((b) => (
          <BookmarkItem key={b.id} bookmark={b} onDelete={onDelete} />
        ))}
    </div>
  );
}
```

- [ ] **Step 5: Create `src/popup/components/ListTab.tsx`**

```tsx
import { useRef } from "react";
import type { Bookmark, SortOption } from "../../shared/types";
import { groupByVideo } from "../../shared/storage";
import { SearchBar } from "./SearchBar";
import { SortSelect } from "./SortSelect";
import { BookmarkGroup } from "./BookmarkGroup";

interface Props {
  bookmarks: Bookmark[];
  search: string;
  setSearch: (s: string) => void;
  sort: SortOption;
  setSort: (s: SortOption) => void;
  remove: (id: string) => void;
  doExport: () => void;
  doImport: (file: File) => void;
}

export function ListTab({
  bookmarks,
  search,
  setSearch,
  sort,
  setSort,
  remove,
  doExport,
  doImport,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const groups = groupByVideo(bookmarks);

  return (
    <div className="list-tab">
      <div className="list-controls">
        <SearchBar value={search} onChange={setSearch} />
        <SortSelect value={sort} onChange={setSort} />
      </div>
      <div className="list-actions">
        <button className="action-btn" onClick={doExport}>
          Export
        </button>
        <button className="action-btn" onClick={() => fileRef.current?.click()}>
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) doImport(file);
          }}
        />
      </div>
      {bookmarks.length === 0 ? (
        <div className="empty-state">
          {search ? "No bookmarks match your search." : "No bookmarks yet. Start bookmarking!"}
        </div>
      ) : (
        Array.from(groups.entries()).map(([videoId, items]) => (
          <BookmarkGroup
            key={videoId}
            videoTitle={items[0].videoTitle}
            thumbnailUrl={items[0].thumbnailUrl}
            bookmarks={items}
            onDelete={remove}
          />
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/popup/components/
git commit -m "feat: ListTab with search, sort, grouping, export/import, and delete"
```

---

## Chunk 4: Polish & Final Build

### Task 11: Generate extension icons

**Files:**
- Create: `public/icons/icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png`
- Delete: `public/cogwheel.svg`

- [ ] **Step 1: Generate simple bookmark icons using a canvas script or download from a free icon set**

We'll create a simple red bookmark icon programmatically during the build, or use an SVG-to-PNG conversion. For now, create a simple SVG in `public/icons/icon.svg` and use it:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="20" y="8" width="88" height="112" rx="8" fill="#cc0000"/>
  <polygon points="20,120 64,92 108,120 108,8 20,8" fill="#cc0000"/>
  <text x="64" y="72" text-anchor="middle" font-size="48" font-weight="bold" fill="white" font-family="sans-serif">▶</text>
</svg>
```

Convert to PNG at required sizes (use an online tool or `sharp` npm package as a one-time script). Place the PNGs in `public/icons/`.

Delete `public/cogwheel.svg`.

- [ ] **Step 2: Commit**

```bash
git add public/icons/ && git rm public/cogwheel.svg
git commit -m "chore: add extension icons, remove unused cogwheel"
```

---

### Task 12: Final build verification and cleanup

**Files:**
- Verify all files compile and build correctly

- [ ] **Step 1: Run linting**

```bash
pnpm lint
```

Fix any Biome errors.

- [ ] **Step 2: Run build**

```bash
pnpm build
```

- [ ] **Step 3: Verify `dist/` output structure**

```bash
ls -R dist/
# Expected:
# dist/
#   popup.html
#   popup.js
#   background.js
#   content.js
#   manifest.json
#   icons/
#     icon-16.png, icon-32.png, icon-48.png, icon-128.png
#   assets/
#     (CSS and other assets)
```

- [ ] **Step 4: Load extension in Chrome**

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `dist/` folder
4. Navigate to a YouTube video
5. Click the extension icon — verify popup shows video info
6. Test bookmarking, editing time, adding a note
7. Switch to "My Bookmarks" tab — verify bookmark appears
8. Test delete, search, sort, export/import
9. Test `Alt+B` keyboard shortcut
10. Verify badge count updates

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete YT Bookmarks extension v1.0"
```
