import type { Settings } from "../../shared/types";

interface Props {
	settings: Settings;
	onUpdate: (patch: Partial<Settings>) => void;
}

export function SettingsTab({ settings, onUpdate }: Props) {
	return (
		<div className="settings-tab">
			<div className="setting-row">
				<span className="setting-label">Auto-delete bookmarks when video ends</span>
				<button
					type="button"
					className={`toggle ${settings.autoDeleteOnEnd ? "on" : ""}`}
					onClick={() => onUpdate({ autoDeleteOnEnd: !settings.autoDeleteOnEnd })}
				>
					<span className="toggle-knob" />
				</button>
			</div>
			<div className="setting-row">
				<span className="setting-label">Restore playback speed from bookmark</span>
				<button
					type="button"
					className={`toggle ${settings.restorePlaybackSpeed ? "on" : ""}`}
					onClick={() => onUpdate({ restorePlaybackSpeed: !settings.restorePlaybackSpeed })}
				>
					<span className="toggle-knob" />
				</button>
			</div>
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
