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

	const titleEl = document.querySelector(
		"yt-formatted-string.style-scope.ytd-watch-metadata",
	) as HTMLElement | null;
	const channelEl = document.querySelector(
		"ytd-channel-name yt-formatted-string a",
	) as HTMLAnchorElement | null;

	return {
		videoId,
		videoTitle: titleEl?.textContent?.trim() ?? "Unknown Title",
		videoUrl: buildVideoUrl(videoId, urlParams),
		channelName: channelEl?.textContent?.trim() ?? "Unknown Channel",
		thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
		currentTime: Math.floor(video.currentTime),
	};
}

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
	if (message.type === "GET_VIDEO_INFO") {
		sendResponse({ type: "VIDEO_INFO", data: getVideoInfo() });
	}
	return true;
});
