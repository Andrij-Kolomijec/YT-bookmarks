interface Props {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: Props) {
	return (
		<div className="setting-row">
			<span className="setting-label">{label}</span>
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				aria-label={label}
				className={`toggle ${checked ? "on" : ""}`}
				onClick={() => onChange(!checked)}
			>
				<span className="toggle-knob" />
			</button>
		</div>
	);
}
