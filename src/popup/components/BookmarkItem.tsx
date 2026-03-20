import type { Bookmark } from "../../shared/types";

function formatTime(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props {
	bookmark: Bookmark;
	onDelete: (id: string) => void;
}

export function BookmarkItem({ bookmark, onDelete }: Props) {
	const url = `${bookmark.videoUrl}&t=${bookmark.timestamp}s`;

	return (
		<div className="bookmark-item">
			<a className="time-link" href={url} target="_blank" rel="noopener noreferrer">
				{formatTime(bookmark.timestamp)}
			</a>
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
