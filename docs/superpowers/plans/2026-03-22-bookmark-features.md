# Bookmark Features Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three features: auto-delete bookmarks when a video ends, configurable rewind offset on bookmark links, and per-bookmark playback speed saving/restoring.

**Architecture:** Extend the shared types and storage layer with a `Settings` interface and `playbackRate` field on bookmarks. Add a Settings tab to the popup. Enhance the content script to handle video end events, SPA navigation, and playback speed application.

**Tech Stack:** React, TypeScript, Chrome Extension APIs (storage, tabs, runtime messaging)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/shared/types.ts` | Modify | Add `playbackRate` to `Bookmark` and `VideoInfo`, add `Settings` type, add new message types |
| `src/shared/constants.ts` | Modify | Add `SETTINGS_KEY` constant and `DEFAULT_SETTINGS` |
| `src/shared/storage.ts` | Modify | Add settings CRUD, add `deleteBookmarksForVideo()`, update import validation |
| `src/content/index.ts` | Modify | Capture playback rate, handle video end, apply speed on navigation |
| `src/background/index.ts` | Modify | Include `playbackRate` in Alt+B bookmark creation |
| `src/popup/App.tsx` | Modify | Add Settings tab |
| `src/popup/App.css` | Modify | Add settings tab styles |
| `src/popup/hooks/useSettings.ts` | Create | Hook for loading/saving settings |
| `src/popup/components/SettingsTab.tsx` | Create | Settings UI component |
| `src/popup/components/BookmarkItem.tsx` | Modify | Apply rewind offset to links, show speed badge |

---

## Task 1: Extend shared types and constants

**Files:**
- Modify: `src/shared/types.ts`
- Modify: `src/shared/constants.ts`

- [ ] **Step 1: Add `playbackRate` to `Bookmark` and `VideoInfo`, add `Settings` type and new messages**

In `src/shared/types.ts`, update to:

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
	playbackRate: number; // e.g. 1, 1.5, 2
}

export interface Settings {
	autoDeleteOnEnd: boolean;
	rewindSeconds: number;
}

export type SortOption = "newest" | "oldest" | "video" | "channel";

export type Message =
	| { type: "GET_VIDEO_INFO" }
	| { type: "VIDEO_INFO"; data: VideoInfo | null }
	| { type: "BOOKMARK_CURRENT"; timestamp?: number }
	| { type: "BOOKMARK_CREATED"; bookmark: Bookmark }
	| { type: "DELETE_VIDEO_BOOKMARKS"; videoId: string };

export interface VideoInfo {
	videoId: string;
	videoTitle: string;
	videoUrl: string;
	channelName: string;
	thumbnailUrl: string;
	currentTime: number;
	playbackRate: number;
}
```

- [ ] **Step 2: Add `SETTINGS_KEY` and `DEFAULT_SETTINGS` to constants**

In `src/shared/constants.ts`, update to:

```typescript
import type { Settings } from "./types";

export const STORAGE_KEY = "yt_bookmarks";
export const SETTINGS_KEY = "yt_bookmarks_settings";

export const DEFAULT_SETTINGS: Settings = {
	autoDeleteOnEnd: false,
	rewindSeconds: 5,
};
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm build`
Expected: Build succeeds (TypeScript errors in files not yet updated are expected — the background and content scripts will be updated in later tasks)

- [ ] **Step 4: Commit**

```bash
git add src/shared/types.ts src/shared/constants.ts
git commit -m "feat: add Settings type, playbackRate field, and new message types"
```

---

## Task 2: Extend storage layer

**Files:**
- Modify: `src/shared/storage.ts`

- [ ] **Step 1: Add settings CRUD and `deleteBookmarksForVideo`**

Add these functions to `src/shared/storage.ts`:

```typescript
import { DEFAULT_SETTINGS, SETTINGS_KEY, STORAGE_KEY } from "./constants";
import type { Bookmark, Settings, SortOption } from "./types";

// ... existing functions stay unchanged ...

export async function deleteBookmarksForVideo(videoId: string): Promise<Bookmark[]> {
	const bookmarks = await getBookmarks();
	const updated = bookmarks.filter((b) => b.videoId !== videoId);
	await chrome.storage.local.set({ [STORAGE_KEY]: updated });
	return updated;
}

export async function getSettings(): Promise<Settings> {
	const result = await chrome.storage.local.get(SETTINGS_KEY);
	return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
}

export async function saveSettings(settings: Settings): Promise<void> {
	await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}
```

Also update the import statement at the top to include `DEFAULT_SETTINGS`, `SETTINGS_KEY`.

- [ ] **Step 2: Update `importBookmarks` validation to handle `playbackRate`**

In the `importBookmarks` function, after the existing field validation block (the `if` checking all `typeof` fields), add a default for `playbackRate`:

```typescript
const imported = parsed.map((b: Record<string, unknown>) => ({
	...b,
	playbackRate: typeof b.playbackRate === "number" ? b.playbackRate : 1,
})) as Bookmark[];
```

Replace the existing `const imported = parsed as Bookmark[];` line with the above.

- [ ] **Step 3: Verify build passes**

Run: `pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/shared/storage.ts
git commit -m "feat: add settings CRUD, deleteBookmarksForVideo, playbackRate import handling"
```

---

## Task 3: Create useSettings hook

**Files:**
- Create: `src/popup/hooks/useSettings.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "../../shared/constants";
import { getSettings, saveSettings } from "../../shared/storage";
import type { Settings } from "../../shared/types";

export function useSettings() {
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

	const load = useCallback(async () => {
		const s = await getSettings();
		setSettings(s);
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	useEffect(() => {
		const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
			if (changes[SETTINGS_KEY]) load();
		};
		chrome.storage.onChanged.addListener(listener);
		return () => chrome.storage.onChanged.removeListener(listener);
	}, [load]);

	const update = async (patch: Partial<Settings>) => {
		const updated = { ...settings, ...patch };
		setSettings(updated);
		await saveSettings(updated);
	};

	return { settings, update };
}
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/popup/hooks/useSettings.ts
git commit -m "feat: add useSettings hook"
```

---

## Task 4: Create SettingsTab component

**Files:**
- Create: `src/popup/components/SettingsTab.tsx`
- Modify: `src/popup/App.css`

- [ ] **Step 1: Create the component**

```typescript
import type { Settings } from "../../shared/types";

interface Props {
	settings: Settings;
	onUpdate: (patch: Partial<Settings>) => void;
}

export function SettingsTab({ settings, onUpdate }: Props) {
	return (
		<div className="settings-tab">
			<label className="setting-row">
				<span className="setting-label">Auto-delete bookmarks when video ends</span>
				<input
					type="checkbox"
					checked={settings.autoDeleteOnEnd}
					onChange={(e) => onUpdate({ autoDeleteOnEnd: e.target.checked })}
				/>
			</label>
			<label className="setting-row">
				<span className="setting-label">Rewind seconds on bookmark open</span>
				<input
					className="setting-number"
					type="number"
					min={0}
					max={60}
					value={settings.rewindSeconds}
					onChange={(e) => onUpdate({ rewindSeconds: Math.max(0, Number(e.target.value) || 0) })}
				/>
			</label>
		</div>
	);
}
```

- [ ] **Step 2: Add CSS for settings tab**

Append to `src/popup/App.css`:

```css
/* Settings Tab */
.settings-tab {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.setting-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	font-size: 13px;
}

.setting-label {
	flex: 1;
}

.setting-number {
	width: 60px;
	padding: 4px 8px;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 13px;
	text-align: center;
}

.setting-number:focus {
	outline: none;
	border-color: #cc0000;
}
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/popup/components/SettingsTab.tsx src/popup/App.css
git commit -m "feat: add SettingsTab component with styles"
```

---

## Task 5: Wire Settings tab into App

**Files:**
- Modify: `src/popup/App.tsx`

- [ ] **Step 1: Add the Settings tab to App**

Update `src/popup/App.tsx`:

```typescript
import { useState } from "react";
import "./App.css";
import { BookmarkTab } from "./components/BookmarkTab";
import { ListTab } from "./components/ListTab";
import { SettingsTab } from "./components/SettingsTab";
import { useBookmarks, useVideoInfo } from "./hooks/useBookmarks";
import { useSettings } from "./hooks/useSettings";

type Tab = "bookmark" | "list" | "settings";

export default function App() {
	const [activeTab, setActiveTab] = useState<Tab>("bookmark");
	const { videoInfo, loading } = useVideoInfo();
	const bookmarkState = useBookmarks();
	const { settings, update: updateSettings } = useSettings();

	return (
		<div className="popup">
			<header className="header">
				<h1>YT Bookmarks</h1>
				<nav className="tabs">
					<button
						className={activeTab === "bookmark" ? "tab active" : "tab"}
						onClick={() => setActiveTab("bookmark")}
						type="button"
					>
						Bookmark
					</button>
					<button
						className={activeTab === "list" ? "tab active" : "tab"}
						onClick={() => setActiveTab("list")}
						type="button"
					>
						My Bookmarks ({bookmarkState.bookmarks.length})
					</button>
					<button
						className={activeTab === "settings" ? "tab active" : "tab"}
						onClick={() => setActiveTab("settings")}
						type="button"
					>
						Settings
					</button>
				</nav>
			</header>
			<main className="content">
				{activeTab === "bookmark" && (
					<BookmarkTab videoInfo={videoInfo} loading={loading} onBookmark={bookmarkState.add} />
				)}
				{activeTab === "list" && <ListTab {...bookmarkState} rewindSeconds={settings.rewindSeconds} />}
				{activeTab === "settings" && <SettingsTab settings={settings} onUpdate={updateSettings} />}
			</main>
		</div>
	);
}
```

Note: `ListTab` now receives `rewindSeconds` — this will be wired in Task 6.

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/popup/App.tsx
git commit -m "feat: add Settings tab to popup navigation"
```

---

## Task 6: Update BookmarkItem with rewind and speed badge

**Files:**
- Modify: `src/popup/components/BookmarkItem.tsx`
- Modify: `src/popup/components/ListTab.tsx`
- Modify: `src/popup/App.css`

- [ ] **Step 1: Pass `rewindSeconds` through ListTab to BookmarkItem**

In `src/popup/components/ListTab.tsx`, add `rewindSeconds: number` to the `Props` interface, and pass it to `BookmarkGroup`:

Add `rewindSeconds` to the Props interface, destructure it from props, and pass `rewindSeconds={rewindSeconds}` to each `<BookmarkGroup>`.

Then in `src/popup/components/BookmarkGroup.tsx`, add `rewindSeconds: number` to its Props and pass it down to each `<BookmarkItem>`.

- [ ] **Step 2: Update BookmarkItem to apply rewind and show speed badge**

Update `src/popup/components/BookmarkItem.tsx`:

```typescript
import { formatTime } from "../../shared/formatTime";
import type { Bookmark } from "../../shared/types";

interface Props {
	bookmark: Bookmark;
	onDelete: (id: string) => void;
	rewindSeconds: number;
}

export function BookmarkItem({ bookmark, onDelete, rewindSeconds }: Props) {
	let href = bookmark.videoUrl;
	try {
		const url = new URL(bookmark.videoUrl);
		const adjustedTime = Math.max(0, bookmark.timestamp - rewindSeconds);
		url.searchParams.set("t", `${adjustedTime}s`);
		href = url.toString();
	} catch {
		// fall back to raw videoUrl if malformed
	}

	return (
		<div className="bookmark-item">
			<a className="time-link" href={href} target="_blank" rel="noopener noreferrer">
				{formatTime(bookmark.timestamp)}
			</a>
			{bookmark.playbackRate !== 1 && (
				<span className="speed-badge">{bookmark.playbackRate}x</span>
			)}
			<span className="note-text">{bookmark.note || "\u2014"}</span>
			<button
				className="delete-btn"
				onClick={() => onDelete(bookmark.id)}
				title="Delete bookmark"
				type="button"
			>
				&times;
			</button>
		</div>
	);
}
```

- [ ] **Step 3: Add speed badge CSS**

Append to the `.bookmark-item` section in `src/popup/App.css`:

```css
.bookmark-item .speed-badge {
	font-size: 10px;
	color: #fff;
	background: #666;
	padding: 1px 4px;
	border-radius: 3px;
	white-space: nowrap;
}
```

- [ ] **Step 4: Verify build passes**

Run: `pnpm build`

- [ ] **Step 5: Commit**

```bash
git add src/popup/components/BookmarkItem.tsx src/popup/components/ListTab.tsx src/popup/components/BookmarkGroup.tsx src/popup/App.css
git commit -m "feat: add rewind offset to bookmark links and speed badge display"
```

---

## Task 7: Update bookmark creation to include playbackRate

**Files:**
- Modify: `src/popup/hooks/useBookmarks.ts`
- Modify: `src/background/index.ts`

- [ ] **Step 1: Update `useBookmarks` add function**

In `src/popup/hooks/useBookmarks.ts`, the `add` function currently does:
```typescript
const { currentTime: _, ...videoData } = videoInfo;
```

Update to also exclude `playbackRate` from the spread (since it's set explicitly):
```typescript
const { currentTime: _, playbackRate, ...videoData } = videoInfo;
const bookmark: Bookmark = {
	id: crypto.randomUUID(),
	...videoData,
	timestamp,
	note,
	playbackRate,
	createdAt: Date.now(),
};
```

This ensures `playbackRate` is explicitly set on the bookmark rather than relying on spread.

- [ ] **Step 2: Update background script bookmark creation**

In `src/background/index.ts`, the `chrome.commands.onCommand` listener creates a bookmark with `...videoInfo`. Update the bookmark creation:

```typescript
const { currentTime, playbackRate, ...videoData } = videoInfo;
const bookmark: Bookmark = {
	id: crypto.randomUUID(),
	...videoData,
	note: "",
	createdAt: Date.now(),
	timestamp: currentTime,
	playbackRate,
};
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/popup/hooks/useBookmarks.ts src/background/index.ts
git commit -m "feat: capture playbackRate when creating bookmarks"
```

---

## Task 8: Update content script

**Files:**
- Modify: `src/content/index.ts`

- [ ] **Step 1: Add `playbackRate` to `getVideoInfo` return**

In the `getVideoInfo()` function, add `playbackRate` to the returned object:

```typescript
return {
	videoId,
	videoTitle,
	videoUrl: buildVideoUrl(videoId, urlParams),
	channelName,
	thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
	currentTime: Math.floor(video.currentTime),
	playbackRate: video.playbackRate,
};
```

- [ ] **Step 2: Add auto-delete on video end and playback speed application**

Add the following after the existing message listener in `src/content/index.ts`:

```typescript
import { SETTINGS_KEY } from "../shared/constants";
import { deleteBookmarksForVideo, getBookmarksForVideo, getSettings } from "../shared/storage";
```

Then add at the bottom of the file:

```typescript
function getVideoId(): string | null {
	return new URLSearchParams(window.location.search).get("v");
}

async function applyBookmarkSpeed() {
	const video = document.querySelector("video");
	if (!video) return;

	const videoId = getVideoId();
	if (!videoId) return;

	const urlParams = new URLSearchParams(window.location.search);
	const tParam = urlParams.get("t");
	if (!tParam) return;

	const seconds = Number.parseInt(tParam.replace("s", ""), 10);
	if (Number.isNaN(seconds)) return;

	const bookmarks = await getBookmarksForVideo(videoId);
	const match = bookmarks.find((b) => Math.abs(b.timestamp - seconds) <= 1);
	if (match && match.playbackRate) {
		video.playbackRate = match.playbackRate;
	}
}

function attachVideoEndListener() {
	const video = document.querySelector("video");
	if (!video) return;

	video.addEventListener(
		"ended",
		async () => {
			const settings = await getSettings();
			if (!settings.autoDeleteOnEnd) return;

			const videoId = getVideoId();
			if (videoId) {
				await deleteBookmarksForVideo(videoId);
			}
		},
		{ once: true },
	);
}

function onPageReady() {
	applyBookmarkSpeed();
	attachVideoEndListener();
}

// Initial load
onPageReady();

// YouTube SPA navigation
document.addEventListener("yt-navigate-finish", () => {
	onPageReady();
});
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm build`

- [ ] **Step 4: Verify lint passes**

Run: `pnpm lint`

- [ ] **Step 5: Commit**

```bash
git add src/content/index.ts
git commit -m "feat: content script captures playback rate, auto-deletes on end, applies speed"
```

---

## Task 9: Rebuild dist and final commit

**Files:**
- Modify: `dist/` (rebuild)

- [ ] **Step 1: Full build and lint**

Run: `pnpm build && pnpm lint`

- [ ] **Step 2: Commit updated dist**

```bash
git add dist/
git commit -m "chore: rebuild dist with new features"
```
