import { useEffect, useState } from "react";
import type { VideoInfo } from "../../shared/types";
import { NoteInput } from "./NoteInput";
import { TimeInput } from "./TimeInput";

interface Props {
	videoInfo: VideoInfo | null;
	loading: boolean;
	onBookmark: (videoInfo: VideoInfo, timestamp: number, note: string) => Promise<void>;
}

export function BookmarkTab({ videoInfo, loading, onBookmark }: Props) {
	const [timestamp, setTimestamp] = useState(videoInfo?.currentTime ?? 0);
	const [note, setNote] = useState("");
	const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (videoInfo && videoInfo.currentTime > 0) {
			setTimestamp(videoInfo.currentTime);
		}
	}, [videoInfo]);

	if (loading) {
		return <div className="status-msg info">Loading...</div>;
	}

	if (!videoInfo) {
		return <div className="status-msg info">Navigate to a YouTube video to create a bookmark.</div>;
	}

	const handleBookmark = async () => {
		setSaving(true);
		setStatus(null);
		try {
			await onBookmark(videoInfo, timestamp, note);
			setStatus({ type: "success", msg: "Bookmark saved!" });
			setNote("");
		} catch (e) {
			setStatus({ type: "error", msg: e instanceof Error ? e.message : "Failed to save" });
		}
		setSaving(false);
	};

	return (
		<div className="bookmark-tab">
			<div className="video-preview">
				<img src={videoInfo.thumbnailUrl} alt="" />
				<div className="video-meta">
					<h3>{videoInfo.videoTitle}</h3>
					<div className="channel">{videoInfo.channelName}</div>
				</div>
			</div>
			{/* biome-ignore lint/a11y/noLabelWithoutControl: input is inside TimeInput component */}
			<label className="time-row">
				<span>Time:</span>
				<TimeInput seconds={timestamp} onChange={setTimestamp} />
			</label>
			<NoteInput value={note} onChange={setNote} />
			<button className="bookmark-btn" onClick={handleBookmark} disabled={saving} type="button">
				{saving ? "Saving..." : "Bookmark"}
			</button>
			{status && <div className={`status-msg ${status.type}`}>{status.msg}</div>}
		</div>
	);
}
