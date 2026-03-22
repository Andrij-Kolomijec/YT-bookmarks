import { deleteBookmarksForVideo, getBookmarksForVideo, getSettings } from "../shared/storage";
import type { Message, VideoInfo } from "../shared/types";

function buildVideoUrl(videoId: string, params: URLSearchParams): string {
	const url = new URL("https://www.youtube.com/watch");
	url.searchParams.set("v", videoId);
	// Preserve playlist context if present
	const list = params.get("list");
	if (list) {
		url.searchParams.set("list", list);
		const index = params.get("index");
		if (index) url.searchParams.set("index", index);
	}
	return url.toString();
}

function getVideoInfo(): VideoInfo | null {
	const video = document.querySelector("video");
	if (!video) return null;

	const urlParams = new URLSearchParams(window.location.search);
	const videoId = urlParams.get("v");
	if (!videoId) return null;

	const videoTitle =
		(
			document.querySelector("yt-formatted-string.style-scope.ytd-watch-metadata") ??
			document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ??
			document.querySelector("#title h1")
		)?.textContent?.trim() ||
		// Last resort: strip " - YouTube" suffix from document.title
		document.title.replace(/\s*-\s*YouTube$/i, "") ||
		"Unknown Title";

	const channelName =
		(
			document.querySelector("ytd-channel-name yt-formatted-string a") ??
			document.querySelector("ytd-video-owner-renderer a") ??
			document.querySelector("#owner #channel-name a")
		)?.textContent?.trim() || "Unknown Channel";

	return {
		videoId,
		videoTitle,
		videoUrl: buildVideoUrl(videoId, urlParams),
		channelName,
		thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
		currentTime: Math.floor(video.currentTime),
		playbackRate: video.playbackRate,
	};
}

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
	if (message.type === "GET_VIDEO_INFO") {
		sendResponse({ type: "VIDEO_INFO", data: getVideoInfo() });
	}
	return true;
});

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
	if (match?.playbackRate) {
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
