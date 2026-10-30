import { Chip } from './Chip';

export interface Option {
  value: string;
  label: string;
  emoji?: string;
}

interface SingleProps {
  options: Option[];
  value?: string;
  onChange: (value: string | undefined) => void;
  multiple?: false;
}

interface MultiProps {
  options: Option[];
  value?: string[];
  onChange: (value: string[]) => void;
  multiple: true;
}

type Props = (SingleProps | MultiProps) & { label?: string };

export function ChipGroup(props: Props) {
  const { options, label } = props;

  function isSelected(v: string): boolean {
    if (props.multiple) return (props.value ?? []).includes(v);
    return props.value === v;
  }

  function toggle(v: string) {
    if (props.multiple) {
      const cur = props.value ?? [];
      props.onChange(
        cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
      );
    } else {
      props.onChange(props.value === v ? undefined : v);
    }
  }

  return (
    <div>
      {label && (
        <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            emoji={o.emoji}
            selected={isSelected(o.value)}
            onClick={() => toggle(o.value)}
          />
        ))}
      </div>
    </div>
  );
}
