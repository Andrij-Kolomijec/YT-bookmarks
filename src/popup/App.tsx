import { useState } from "react";
import "./App.css";
import { BookmarkTab } from "./components/BookmarkTab";
import { ListTab } from "./components/ListTab";
import { SettingsTab } from "./components/SettingsTab";
import { ShortcutHint } from "./components/ShortcutHint";
import { useBookmarks, useVideoInfo } from "./hooks/useBookmarks";
import { useSettings } from "./hooks/useSettings";

type Tab = "bookmark" | "list" | "settings";

export default function App() {
	const [activeTab, setActiveTab] = useState<Tab>("bookmark");
	const { videoInfo, loading } = useVideoInfo();
	const bookmarkState = useBookmarks();
	const { settings, update: updateSettings } = useSettings();

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
					<button
						className={activeTab === "settings" ? "tab active" : "tab"}
						onClick={() => setActiveTab("settings")}
						type="button"
					>
						Settings
					</button>
				</nav>
			</header>
			<main className="content">
				{activeTab === "bookmark" && (
					<BookmarkTab videoInfo={videoInfo} loading={loading} onBookmark={bookmarkState.add} />
				)}
				{activeTab === "list" && (
					<ListTab {...bookmarkState} rewindSeconds={settings.rewindSeconds} openInNewTab={settings.openInNewTab} />
				)}
				{activeTab === "settings" && <SettingsTab settings={settings} onUpdate={updateSettings} />}
			</main>
			{activeTab !== "list" && <ShortcutHint />}
		</div>
	);
}
