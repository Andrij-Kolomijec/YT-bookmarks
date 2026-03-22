import { formatTime } from "../../shared/formatTime";
import type { Bookmark } from "../../shared/types";

interface Props {
	bookmark: Bookmark;
	onDelete: (id: string) => void;
	rewindSeconds: number;
}

export function BookmarkItem({ bookmark, onDelete, rewindSeconds }: Props) {
	let href = bookmark.videoUrl;
	try {
		const url = new URL(bookmark.videoUrl);
		const adjustedTime = Math.max(0, bookmark.timestamp - rewindSeconds);
		url.searchParams.set("t", `${adjustedTime}s`);
		href = url.toString();
	} catch {
		// fall back to raw videoUrl if malformed
	}

	return (
		<div className="bookmark-item">
			<a className="time-link" href={href} target="_blank" rel="noopener noreferrer">
				{formatTime(bookmark.timestamp)}
			</a>
			{bookmark.playbackRate !== 1 && (
				<span className="speed-badge">{bookmark.playbackRate}x</span>
			)}
			<span className="note-text">{bookmark.note || "\u2014"}</span>
			<button
				className="delete-btn"
				onClick={() => onDelete(bookmark.id)}
				title="Delete bookmark"
				type="button"
			>
				&times;
			</button>
		</div>
	);
}
