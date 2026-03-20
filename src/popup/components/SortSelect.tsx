import type { SortOption } from "../../shared/types";

interface Props {
	value: SortOption;
	onChange: (value: SortOption) => void;
}

const SORT_OPTIONS: SortOption[] = ["newest", "oldest", "video", "channel"];

const LABELS: Record<SortOption, string> = {
	newest: "Newest",
	oldest: "Oldest",
	video: "By Video",
	channel: "By Channel",
};

function isSortOption(value: string): value is SortOption {
	return (SORT_OPTIONS as string[]).includes(value);
}

export function SortSelect({ value, onChange }: Props) {
	return (
		<select
			className="sort-select"
			value={value}
			onChange={(e) => {
				if (isSortOption(e.target.value)) onChange(e.target.value);
			}}
		>
			{SORT_OPTIONS.map((o) => (
				<option key={o} value={o}>
					{LABELS[o]}
				</option>
			))}
		</select>
	);
}
