import { useCallback, useEffect, useState } from "react";

function formatTime(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	return `${m}:${String(s).padStart(2, "0")}`;
}

function parseTime(str: string): number | null {
	const parts = str.split(":").map(Number);
	if (parts.some((p) => Number.isNaN(p) || p < 0)) return null;
	if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
	if (parts.length === 2) return parts[0] * 60 + parts[1];
	if (parts.length === 1) return parts[0];
	return null;
}

interface Props {
	seconds: number;
	onChange: (seconds: number) => void;
}

export function TimeInput({ seconds, onChange }: Props) {
	const [value, setValue] = useState(formatTime(seconds));

	useEffect(() => {
		setValue(formatTime(seconds));
	}, [seconds]);

	const handleBlur = useCallback(() => {
		const parsed = parseTime(value);
		if (parsed !== null && parsed >= 0) {
			onChange(parsed);
			setValue(formatTime(parsed));
		} else {
			setValue(formatTime(seconds));
		}
	}, [value, seconds, onChange]);

	return (
		<input
			className="time-input"
			value={value}
			onChange={(e) => setValue(e.target.value)}
			onBlur={handleBlur}
			onKeyDown={(e) => {
				if (e.key === "Enter") handleBlur();
			}}
		/>
	);
}
