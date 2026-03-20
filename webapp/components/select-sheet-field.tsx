"use client";

import { useEffect, useState } from "react";

type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

type SelectSheetFieldProps = {
  name: string;
  label: string;
  value: string;
  placeholder: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function SelectSheetField({
  name,
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
}: SelectSheetFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <>
      <div className="grid gap-2 text-sm font-medium">
        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">{label}</span>
        <input type="hidden" name={name} value={value} />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="flex min-h-14 items-center justify-between rounded-2xl bg-surface-container-high px-4 py-3 text-left text-ink shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={selected ? "font-semibold text-ink" : "text-muted"}>
            {selected?.label ?? placeholder}
          </span>
          <span className="material-symbols-outlined text-[20px] text-muted" aria-hidden="true">
            expand_more
          </span>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label={`${label} 닫기`}
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-[32px] bg-surface p-4 shadow-soft">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-outline-variant/70" />
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">{label}</p>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-ink">{placeholder}</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-10 items-center justify-center rounded-full bg-surface-container-low text-muted"
                aria-label="닫기"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
            <div className="no-scrollbar max-h-[55dvh] space-y-2 overflow-y-auto pb-2">
              {options.map((option) => {
                const active = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start justify-between gap-3 rounded-[24px] px-4 py-4 text-left transition ${
                      active
                        ? "bg-primary-fixed text-primary shadow-sm"
                        : "bg-surface-container-low text-ink"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{option.label}</span>
                      {option.description ? (
                        <span className="mt-1 block text-xs leading-5 text-muted">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    {active ? (
                      <span className="material-symbols-outlined filled text-[20px]" aria-hidden="true">
                        check_circle
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
