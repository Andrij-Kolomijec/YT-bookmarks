import { useEffect, useState } from "react";

function getShortcutsUrl(): string {
	const ua = navigator.userAgent;
	if ("browser" in globalThis) return "about:addons";
	if (ua.includes("Brave")) return "brave://extensions/shortcuts";
	return "chrome://extensions/shortcuts";
}

export function ShortcutHint() {
	const [shortcut, setShortcut] = useState<string>("");
	const shortcutsUrl = getShortcutsUrl();

	useEffect(() => {
		chrome.commands.getAll((commands) => {
			const cmd = commands.find((c) => c.name === "bookmark-current");
			setShortcut(cmd?.shortcut || "Not set");
		});
	}, []);

	const openShortcuts = (e: React.MouseEvent) => {
		e.preventDefault();
		chrome.tabs.create({ url: shortcutsUrl });
	};

	return (
		<p className="shortcut-hint">
			Shortcut: <strong>{shortcut}</strong>
			<br />
			Customize in{" "}
			<a href={shortcutsUrl} onClick={openShortcuts}>
				extension settings
			</a>
		</p>
	);
}
