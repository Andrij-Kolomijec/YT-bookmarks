import { useCallback, useEffect, useMemo, useState } from "react";
import { STORAGE_KEY } from "../../shared/constants";
import {
	addBookmark,
	deleteBookmark,
	exportBookmarks,
	filterBookmarks,
	getBookmarks,
	importBookmarks,
	sortBookmarks,
} from "../../shared/storage";
import type { Bookmark, SortOption, VideoInfo } from "../../shared/types";

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

	useEffect(() => {
		const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
			if (changes[STORAGE_KEY]) load();
		};
		chrome.storage.onChanged.addListener(listener);
		return () => chrome.storage.onChanged.removeListener(listener);
	}, [load]);

	const sorted = useMemo(() => {
		const filtered = filterBookmarks(bookmarks, search);
		return sortBookmarks(filtered, sort);
	}, [bookmarks, search, sort]);

	// State sync is handled by the storage.onChanged listener above,
	// so we don't call setBookmarks here (avoids double renders).
	const add = async (videoInfo: VideoInfo, timestamp: number, note: string) => {
		const { currentTime: _, playbackRate, ...videoData } = videoInfo;
		const bookmark: Bookmark = {
			id: crypto.randomUUID(),
			...videoData,
			timestamp,
			note,
			playbackRate,
			createdAt: Date.now(),
		};
		await addBookmark(bookmark);
	};

	const remove = async (id: string) => {
		await deleteBookmark(id);
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

	const [importError, setImportError] = useState<string | null>(null);

	const doImport = async (file: File) => {
		setImportError(null);
		try {
			const text = await file.text();
			await importBookmarks(text);
		} catch (e) {
			setImportError(e instanceof Error ? e.message : "Failed to import bookmarks");
		}
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
		importError,
	};
}

export function useVideoInfo() {
	const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchInfo() {
			try {
				const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
				if (!tab?.id || !tab.url?.includes("youtube.com/watch")) {
					setVideoInfo(null);
					setLoading(false);
					return;
				}
				const response = await chrome.tabs.sendMessage(tab.id, {
					type: "GET_VIDEO_INFO",
				});
				setVideoInfo(response?.data ?? null);
			} catch {
				setVideoInfo(null);
			}
			setLoading(false);
		}
		fetchInfo();
	}, []);

	return { videoInfo, loading };
}
