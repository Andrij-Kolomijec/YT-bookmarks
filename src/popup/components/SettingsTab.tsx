import type { Settings } from "../../shared/types";

interface Props {
	settings: Settings;
	onUpdate: (patch: Partial<Settings>) => void;
}

export function SettingsTab({ settings, onUpdate }: Props) {
	return (
		<div className="settings-tab">
			<label className="setting-row">
				<span className="setting-label">Auto-delete bookmarks when video ends</span>
				<input
					type="checkbox"
					checked={settings.autoDeleteOnEnd}
					onChange={(e) => onUpdate({ autoDeleteOnEnd: e.target.checked })}
				/>
			</label>
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
