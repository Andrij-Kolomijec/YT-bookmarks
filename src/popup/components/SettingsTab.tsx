import type { Settings } from "../../shared/types";
import { Toggle } from "./Toggle";

interface Props {
	settings: Settings;
	onUpdate: (patch: Partial<Settings>) => void;
}

export function SettingsTab({ settings, onUpdate }: Props) {
	return (
		<div className="settings-tab">
			<Toggle
				label="Auto-delete bookmarks when video ends"
				checked={settings.autoDeleteOnEnd}
				onChange={(v) => onUpdate({ autoDeleteOnEnd: v })}
			/>
			<Toggle
				label="Restore playback speed from bookmark"
				checked={settings.restorePlaybackSpeed}
				onChange={(v) => onUpdate({ restorePlaybackSpeed: v })}
			/>
			<Toggle
				label="Open links in a new tab"
				checked={settings.openInNewTab}
				onChange={(v) => onUpdate({ openInNewTab: v })}
			/>
			<label className="setting-row">
				<span className="setting-label">Rewind seconds on bookmark open</span>
				<input
					className="setting-number"
					type="number"
					min={0}
					max={60}
					value={settings.rewindSeconds}
					onChange={(e) => onUpdate({ rewindSeconds: Math.max(0, Number(e.target.value) || 0) })}
				/>
			</label>
		</div>
	);
}
