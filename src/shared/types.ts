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
}

export type SortOption = "newest" | "oldest" | "video" | "channel";

export type Message =
	| { type: "GET_VIDEO_INFO" }
	| { type: "VIDEO_INFO"; data: VideoInfo | null }
	| { type: "BOOKMARK_CURRENT"; timestamp?: number }
	| { type: "BOOKMARK_CREATED"; bookmark: Bookmark };

export interface VideoInfo {
	videoId: string;
	videoTitle: string;
	videoUrl: string;
	channelName: string;
	thumbnailUrl: string;
	currentTime: number;
}
