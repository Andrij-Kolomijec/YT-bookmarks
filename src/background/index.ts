import { addBookmark, getBookmarksForVideo } from "../shared/storage";
import type { Bookmark, VideoInfo } from "../shared/types";

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

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete" && tab.url?.includes("youtube.com/watch")) {
		const url = new URL(tab.url);
		const videoId = url.searchParams.get("v");
		await updateBadge(tabId, videoId);
	}
});

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
		// Already bookmarked at this timestamp
	}
});

chrome.storage.onChanged.addListener(async (changes) => {
	if (!changes.yt_bookmarks) return;
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	if (!tab?.id || !tab.url?.includes("youtube.com/watch")) return;
	const url = new URL(tab.url);
	const videoId = url.searchParams.get("v");
	await updateBadge(tab.id, videoId);
});
