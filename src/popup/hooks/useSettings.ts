import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "../../shared/constants";
import { getSettings, saveSettings } from "../../shared/storage";
import type { Settings } from "../../shared/types";

export function useSettings() {
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

	const load = useCallback(async () => {
		const s = await getSettings();
		setSettings(s);
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	useEffect(() => {
		const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
			if (changes[SETTINGS_KEY]) load();
		};
		chrome.storage.onChanged.addListener(listener);
		return () => chrome.storage.onChanged.removeListener(listener);
	}, [load]);

	const update = async (patch: Partial<Settings>) => {
		const updated = { ...settings, ...patch };
		setSettings(updated);
		await saveSettings(updated);
	};

	return { settings, update };
}
