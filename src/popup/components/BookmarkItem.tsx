import { formatTime } from "../../shared/formatTime";
import type { Bookmark } from "../../shared/types";

interface Props {
	bookmark: Bookmark;
	onDelete: (id: string) => void;
}

export function BookmarkItem({ bookmark, onDelete }: Props) {
	const url = new URL(bookmark.videoUrl);
	url.searchParams.set("t", `${bookmark.timestamp}s`);

	return (
		<div className="bookmark-item">
			<a className="time-link" href={url.toString()} target="_blank" rel="noopener noreferrer">
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
