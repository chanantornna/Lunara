interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  emoji?: string;
}

export function Chip({ label, selected, onClick, emoji }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`chip ${selected ? 'chip-on' : 'chip-off'}`}
    >
      {emoji && <span aria-hidden>{emoji}</span>}
      {label}
    </button>
  );
}
