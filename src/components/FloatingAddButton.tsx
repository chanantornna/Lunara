import { useState } from 'react';

export interface QuickAction {
  label: string;
  emoji: string;
  onSelect: () => void;
}

export function FloatingAddButton({ actions }: { actions: QuickAction[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30"
          onClick={() => setOpen(false)}
        >
          <div
            className="pb-safe absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-xl2 bg-white p-4 dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/10 dark:bg-white/20" />
            <h3 className="mb-3 text-center font-semibold text-lunara-plum dark:text-lunara-lilac">
              บันทึกด่วน
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    a.onSelect();
                  }}
                  className="flex items-center gap-3 rounded-xl2 bg-lunara-pink-soft px-4 py-3 text-left font-medium text-lunara-plum dark:bg-slate-700 dark:text-slate-100"
                >
                  <span className="text-xl" aria-hidden>
                    {a.emoji}
                  </span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label="บันทึกด่วน"
        onClick={() => setOpen(true)}
        className="fixed bottom-[4.5rem] right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-lunara-rose text-3xl text-white shadow-lg active:scale-95"
      >
        +
      </button>
    </>
  );
}
