import { ReactNode } from "react";

type TopAppBarProps = {
  title: string;
  description?: string;
  right?: ReactNode;
};

export function TopAppBar({ title, description, right }: TopAppBarProps) {
  return (
    <header className="sticky top-0 z-50 bg-surface/70 shadow-soft backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-4 px-4 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-indigo-700" aria-hidden="true">
              style
            </span>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-indigo-700">
              TCG Match Tracker
            </p>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="truncate text-lg font-black tracking-tight text-on-surface">{title}</h1>
            <span className="inline-flex h-2 w-2 rounded-full bg-primary shadow-[0_0_0_4px_rgba(81,63,198,0.12)]" />
          </div>
          {description ? <p className="mt-1 text-sm text-on-surface-variant">{description}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </header>
  );
}
