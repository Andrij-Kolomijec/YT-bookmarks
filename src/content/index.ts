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
	const settings = await getSettings();
	if (!settings.restorePlaybackSpeed) return;

	const videoId = getVideoId();
	if (!videoId) return;

	const urlParams = new URLSearchParams(window.location.search);
	const tParam = urlParams.get("t");
	if (!tParam) return;

	const seconds = Number.parseInt(tParam.replace("s", ""), 10);
	if (Number.isNaN(seconds)) return;

	const tolerance = settings.rewindSeconds + 1;

	const bookmarks = await getBookmarksForVideo(videoId);
	const match = bookmarks.find((b) => {
		const diff = b.timestamp - seconds;
		return diff >= 0 && diff <= tolerance;
	});
	if (!match?.playbackRate || match.playbackRate === 1) return;

	// Wait for video element to be ready
	const video = await waitForVideo();
	if (!video) return;

	// Apply speed with retries — YouTube's player may reset playbackRate during init
	const rate = match.playbackRate;
	video.playbackRate = rate;
	speedRetryInterval = setInterval(() => {
		if (video.playbackRate !== rate) {
			video.playbackRate = rate;
		}
		speedRetryAttempts++;
		if (speedRetryAttempts >= 10) clearSpeedRetry();
	}, 300);
}

// Track playback speed retry interval so it can be cancelled on SPA navigation
let speedRetryInterval: ReturnType<typeof setInterval> | null = null;
let speedRetryAttempts = 0;

function clearSpeedRetry() {
	if (speedRetryInterval) {
		clearInterval(speedRetryInterval);
		speedRetryInterval = null;
	}
	speedRetryAttempts = 0;
}

function waitForVideo(): Promise<HTMLVideoElement | null> {
	return new Promise((resolve) => {
		const existing = document.querySelector("video");
		if (existing) {
			resolve(existing);
			return;
		}
		const observer = new MutationObserver(() => {
			const video = document.querySelector("video");
			if (video) {
				observer.disconnect();
				resolve(video);
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });
		setTimeout(() => {
			observer.disconnect();
			resolve(null);
		}, 5000);
	});
}

// Track active auto-delete watcher so it can be cancelled on SPA navigation
let autoDeleteCleanup: (() => void) | null = null;

async function attachVideoEndListener() {
	// Cancel previous watcher (YouTube reuses the same <video> element across navigations)
	autoDeleteCleanup?.();
	autoDeleteCleanup = null;

	const video = await waitForVideo();
	if (!video) return;

	// Capture videoId now — autoplay may change the URL before the handler runs
	const videoId = getVideoId();
	if (!videoId) return;

	let deleted = false;
	const onTimeUpdate = async () => {
		if (deleted) return;
		if (!video.duration || video.duration === Number.POSITIVE_INFINITY) return;
		if (video.currentTime / video.duration >= 0.99) {
			deleted = true;
			video.removeEventListener("timeupdate", onTimeUpdate);
			const settings = await getSettings();
			if (!settings.autoDeleteOnEnd) return;
			await deleteBookmarksForVideo(videoId);
		}
	};

	video.addEventListener("timeupdate", onTimeUpdate);
	autoDeleteCleanup = () => video.removeEventListener("timeupdate", onTimeUpdate);
}

function onPageReady() {
	clearSpeedRetry();
	applyBookmarkSpeed();
	attachVideoEndListener();
}

// Initial load
onPageReady();

// YouTube SPA navigation
document.addEventListener("yt-navigate-finish", () => {
	onPageReady();
});
