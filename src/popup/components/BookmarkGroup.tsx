import { useState } from "react";
import type { Bookmark } from "../../shared/types";
import { BookmarkItem } from "./BookmarkItem";

interface Props {
	videoTitle: string;
	thumbnailUrl: string;
	bookmarks: Bookmark[];
	onDelete: (id: string) => void;
	rewindSeconds: number;
}

export function BookmarkGroup({
	videoTitle,
	thumbnailUrl,
	bookmarks,
	onDelete,
	rewindSeconds,
}: Props) {
	const [open, setOpen] = useState(true);

	return (
		<div className="video-group">
			<button className="group-header" onClick={() => setOpen(!open)} type="button">
				<img src={thumbnailUrl} alt="" />
				<span className="group-title">{videoTitle}</span>
				<span className="group-count">{bookmarks.length}</span>
				<span>{open ? "\u25BE" : "\u25B8"}</span>
			</button>
			{open &&
				bookmarks.map((b) => (
					<BookmarkItem key={b.id} bookmark={b} onDelete={onDelete} rewindSeconds={rewindSeconds} />
				))}
		</div>
	);
}
