import { ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";

type AppShellProps = {
  title: string;
  description?: string;
  headerRight?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, description, headerRight, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              TCG Match Tracker
            </p>
            <h1 className="text-lg font-semibold">{title}</h1>
            {description ? <p className="text-sm text-slate-500">{description}</p> : null}
          </div>
          {headerRight ? <div>{headerRight}</div> : null}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <BottomNav />
    </div>
  );
}
