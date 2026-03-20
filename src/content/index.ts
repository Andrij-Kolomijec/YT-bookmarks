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
		videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
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
