# Bookmark Features Design

Three new features for the YT Bookmarks extension: auto-delete on video end, rewind offset, and playback speed saving.

## Data Model

### Bookmark type — new field

```typescript
interface Bookmark {
  // ...existing fields
  playbackRate: number; // captured at bookmark time, default 1
}
```

### New Settings type

```typescript
interface Settings {
  autoDeleteOnEnd: boolean; // default: false
  rewindSeconds: number;    // default: 5
}
```

Stored under `yt_bookmarks_settings` key in `chrome.storage.local`, separate from bookmark data.

### VideoInfo type — new field

```typescript
interface VideoInfo {
  // ...existing fields
  playbackRate: number;
}
```

### Backward compatibility

- Existing bookmarks without `playbackRate` default to 1
- Old exports without `playbackRate` are accepted on import, defaulting to 1

## Content Script Changes

### Capture playback rate

Include `video.playbackRate` in the `VideoInfo` response alongside `currentTime`.

### Apply playback speed on bookmark load

When a YouTube page loads with a `?t=` parameter:
1. Extract videoId and timestamp from the URL
2. Query stored bookmarks for that video
3. Find one matching the timestamp
4. Set `video.playbackRate` to the saved value

### Auto-delete on video end

Listen for the video `ended` event:
1. Check settings for `autoDeleteOnEnd`
2. If enabled, delete all bookmarks for that video from storage

### SPA navigation handling

YouTube is a SPA — navigating between videos doesn't trigger a full page reload. The content script watches for `yt-navigate-finish` events to:
- Re-attach the `ended` listener to the new video element
- Re-apply playback speed if navigating to a bookmarked timestamp

## Background Script Changes

Minimal changes. Bookmark creation via Alt+B already spreads `VideoInfo`, so `playbackRate` comes along automatically. The `currentTime` exclusion destructure needs to keep `playbackRate` in the spread.

## Popup UI Changes

### New Settings tab

Third tab alongside "Bookmark" and "My Bookmarks" containing:
- Toggle for "Auto-delete bookmarks when video ends" (off by default)
- Number input for "Rewind seconds" with default value of 5

### Bookmark link generation

`BookmarkItem` subtracts `rewindSeconds` from the timestamp in the `?t=` URL param. The displayed timestamp remains the original bookmark time.

### Playback speed display

Show a "1.5x" badge next to each bookmark item only when `playbackRate !== 1`, keeping the UI clean for normal-speed bookmarks.

### New useSettings hook

Loads and saves settings from `chrome.storage.local`. Listens to `storage.onChanged` for the settings key to stay in sync.

## Import/Export

- Export includes `playbackRate` in bookmark data
- Import validates `playbackRate` field, defaults to 1 if missing (handles old exports)
