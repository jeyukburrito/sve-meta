import Link from "next/link";
import { ReactNode } from "react";

import { navigationItems } from "@/lib/navigation";

type AppShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AppShell({ title, description, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Shadowverse EVOLVE
            </p>
            <h1 className="text-lg font-semibold">{title}</h1>
            {description ? <p className="text-sm text-neutral-600">{description}</p> : null}
          </div>
          <Link
            href="/login"
            className="rounded-full border border-line px-4 py-2 text-sm font-medium"
          >
            로그인
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <nav className="sticky bottom-0 border-t border-line bg-white/90 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-4">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-3 text-center text-sm font-medium text-neutral-700"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
