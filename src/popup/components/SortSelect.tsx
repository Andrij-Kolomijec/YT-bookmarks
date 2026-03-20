import type { SortOption } from "../../shared/types";

interface Props {
	value: SortOption;
	onChange: (value: SortOption) => void;
}

const OPTIONS: { value: SortOption; label: string }[] = [
	{ value: "newest", label: "Newest" },
	{ value: "oldest", label: "Oldest" },
	{ value: "video", label: "By Video" },
	{ value: "channel", label: "By Channel" },
];

export function SortSelect({ value, onChange }: Props) {
	return (
		<select
			className="sort-select"
			value={value}
			onChange={(e) => onChange(e.target.value as SortOption)}
		>
			{OPTIONS.map((o) => (
				<option key={o.value} value={o.value}>
					{o.label}
				</option>
			))}
		</select>
	);
}
