import { useCallback, useEffect, useState } from "react";
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
		const listener = () => {
			load();
		};
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
