import { STORAGE_KEY } from "./constants";
import type { Bookmark, SortOption } from "./types";

export async function getBookmarks(): Promise<Bookmark[]> {
	const result = await chrome.storage.local.get(STORAGE_KEY);
	return result[STORAGE_KEY] ?? [];
}

export async function addBookmark(bookmark: Bookmark): Promise<Bookmark[]> {
	const bookmarks = await getBookmarks();
	const exists = bookmarks.some(
		(b) => b.videoId === bookmark.videoId && b.timestamp === bookmark.timestamp,
	);
	if (exists) {
		throw new Error("Bookmark already exists for this video at this timestamp");
	}
	const updated = [bookmark, ...bookmarks];
	await chrome.storage.local.set({ [STORAGE_KEY]: updated });
	return updated;
}

export async function deleteBookmark(id: string): Promise<Bookmark[]> {
	const bookmarks = await getBookmarks();
	const updated = bookmarks.filter((b) => b.id !== id);
	await chrome.storage.local.set({ [STORAGE_KEY]: updated });
	return updated;
}

export async function getBookmarksForVideo(videoId: string): Promise<Bookmark[]> {
	const bookmarks = await getBookmarks();
	return bookmarks.filter((b) => b.videoId === videoId);
}

export function sortBookmarks(bookmarks: Bookmark[], sort: SortOption): Bookmark[] {
	const sorted = [...bookmarks];
	switch (sort) {
		case "newest":
			return sorted.sort((a, b) => b.createdAt - a.createdAt);
		case "oldest":
			return sorted.sort((a, b) => a.createdAt - b.createdAt);
		case "video":
			return sorted.sort((a, b) => a.videoTitle.localeCompare(b.videoTitle));
		case "channel":
			return sorted.sort((a, b) => a.channelName.localeCompare(b.channelName));
	}
}

export function filterBookmarks(bookmarks: Bookmark[], query: string): Bookmark[] {
	const q = query.toLowerCase();
	return bookmarks.filter(
		(b) =>
			b.videoTitle.toLowerCase().includes(q) ||
			b.channelName.toLowerCase().includes(q) ||
			b.note.toLowerCase().includes(q),
	);
}

export function groupByVideo(bookmarks: Bookmark[]): Map<string, Bookmark[]> {
	const groups = new Map<string, Bookmark[]>();
	for (const b of bookmarks) {
		const existing = groups.get(b.videoId) ?? [];
		existing.push(b);
		groups.set(b.videoId, existing);
	}
	return groups;
}

export async function exportBookmarks(): Promise<string> {
	const bookmarks = await getBookmarks();
	return JSON.stringify(bookmarks, null, 2);
}

export async function importBookmarks(json: string): Promise<Bookmark[]> {
	const parsed: unknown = JSON.parse(json);
	if (!Array.isArray(parsed)) {
		throw new Error("Invalid bookmark format: expected an array");
	}
	for (const b of parsed) {
		if (
			typeof b !== "object" ||
			b === null ||
			typeof b.id !== "string" ||
			typeof b.videoId !== "string" ||
			typeof b.videoTitle !== "string" ||
			typeof b.videoUrl !== "string" ||
			typeof b.channelName !== "string" ||
			typeof b.thumbnailUrl !== "string" ||
			typeof b.timestamp !== "number" ||
			typeof b.note !== "string" ||
			typeof b.createdAt !== "number"
		) {
			throw new Error("Invalid bookmark format: missing or malformed fields");
		}
	}
	const imported = parsed as Bookmark[];
	const existing = await getBookmarks();
	const existingIds = new Set(existing.map((b) => b.id));
	const newBookmarks = imported.filter((b) => !existingIds.has(b.id));
	const merged = [...newBookmarks, ...existing];
	await chrome.storage.local.set({ [STORAGE_KEY]: merged });
	return merged;
}
