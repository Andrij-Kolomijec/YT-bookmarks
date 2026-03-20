interface Props {
	value: string;
	onChange: (value: string) => void;
}

export function NoteInput({ value, onChange }: Props) {
	return (
		<textarea
			className="note-input"
			placeholder="Add a note (optional)"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			rows={2}
		/>
	);
}
