import { formatTime } from "../../shared/formatTime";
import type { Bookmark } from "../../shared/types";

interface Props {
	bookmark: Bookmark;
	onDelete: (id: string) => void;
	rewindSeconds: number;
	openInNewTab: boolean;
}

export function BookmarkItem({ bookmark, onDelete, rewindSeconds, openInNewTab }: Props) {
	let href = bookmark.videoUrl;
	try {
		const url = new URL(bookmark.videoUrl);
		const adjustedTime = Math.max(0, bookmark.timestamp - rewindSeconds);
		url.searchParams.set("t", `${adjustedTime}s`);
		href = url.toString();
	} catch {
		// fall back to raw videoUrl if malformed
	}

	const navigate = (e: React.MouseEvent | React.KeyboardEvent) => {
		e.preventDefault();
		if (openInNewTab) {
			window.open(href, "_blank", "noopener,noreferrer");
		} else {
			chrome.tabs
				.update({ url: href })
				.then(() => window.close())
				.catch(() => window.open(href));
		}
	};

	const handleDeleteClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onDelete(bookmark.id);
	};

	return (
		<a
			className="bookmark-item"
			href={href}
			onClick={navigate}
			onKeyDown={(e) => {
				if (e.key === "Enter") navigate(e);
			}}
		>
			<span className="time-link">{formatTime(bookmark.timestamp)}</span>
			{bookmark.playbackRate !== 1 && <span className="speed-badge">{bookmark.playbackRate}x</span>}
			<span className="note-text">{bookmark.note || "\u2014"}</span>
			<button
				className="delete-btn"
				onClick={handleDeleteClick}
				title="Delete bookmark"
				type="button"
			>
				<svg
					aria-hidden="true"
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4M13 4v9.333a1.333 1.333 0 0 1-1.333 1.334H4.333A1.333 1.333 0 0 1 3 13.333V4h10zM6.667 7.333v4M9.333 7.333v4" />
				</svg>
			</button>
		</a>
	);
}
