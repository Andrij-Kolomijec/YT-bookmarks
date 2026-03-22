import { useState } from "react";
import "./App.css";
import { BookmarkTab } from "./components/BookmarkTab";
import { ListTab } from "./components/ListTab";
import { useBookmarks, useVideoInfo } from "./hooks/useBookmarks";

type Tab = "bookmark" | "list";

export default function App() {
	const [activeTab, setActiveTab] = useState<Tab>("bookmark");
	const { videoInfo, loading } = useVideoInfo();
	const bookmarkState = useBookmarks();

	return (
		<div className="popup">
			<header className="header">
				<h1>YT Bookmarks</h1>
				<nav className="tabs">
					<button
						className={activeTab === "bookmark" ? "tab active" : "tab"}
						onClick={() => setActiveTab("bookmark")}
						type="button"
					>
						Bookmark
					</button>
					<button
						className={activeTab === "list" ? "tab active" : "tab"}
						onClick={() => setActiveTab("list")}
						type="button"
					>
						My Bookmarks ({bookmarkState.bookmarks.length})
					</button>
				</nav>
			</header>
			<main className="content">
				{activeTab === "bookmark" ? (
					<BookmarkTab videoInfo={videoInfo} loading={loading} onBookmark={bookmarkState.add} />
				) : (
					<ListTab {...bookmarkState} />
				)}
				{activeTab === "list" && (
					<ListTab {...bookmarkState} rewindSeconds={settings.rewindSeconds} />
				)}
				{activeTab === "settings" && <SettingsTab settings={settings} onUpdate={updateSettings} />}
			</main>
		</div>
	);
}
