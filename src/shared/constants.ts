import type { Settings } from "./types";

export const STORAGE_KEY = "yt_bookmarks";
export const SETTINGS_KEY = "yt_bookmarks_settings";

export const DEFAULT_SETTINGS: Settings = {
	autoDeleteOnEnd: false,
	rewindSeconds: 5,
};
