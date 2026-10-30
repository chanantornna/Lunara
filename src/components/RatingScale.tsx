interface RatingScaleProps {
  label?: string;
  min?: number;
  max: number;
  value?: number;
  onChange: (value: number | undefined) => void;
}

export function RatingScale({
  label,
  min = 1,
  max,
  value,
  onChange,
}: RatingScaleProps) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div>
      {label && (
        <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(value === n ? undefined : n)}
            className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
              value === n
                ? 'bg-lunara-rose text-white'
                : 'bg-lunara-pink-soft text-lunara-plum dark:bg-slate-700 dark:text-slate-200'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
