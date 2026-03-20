"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigationItems } from "@/lib/navigation";

function isActive(href: string, pathname: string) {
  if (href === "/matches/new") {
    return pathname === "/matches/new";
  }

  if (href === "/matches") {
    return pathname === "/matches" || (pathname.startsWith("/matches/") && pathname !== "/matches/new");
  }

  return pathname === href || pathname.startsWith(href + "/");
}

function NavIcon({ href, active }: { href: string; active: boolean }) {
  const colorClass = active ? "text-indigo-700" : "text-on-surface-variant";
  const icon =
    href === "/matches/new"
      ? "add_circle"
      : href === "/matches"
        ? "history"
        : href === "/dashboard"
          ? "dashboard"
          : href === "/settings"
            ? "settings"
            : "home";

  return (
    <span
      className={`material-symbols-outlined text-[22px] ${active ? "filled" : ""} ${colorClass}`}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 h-20 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto grid h-full max-w-md grid-cols-4 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-nav">
        {navigationItems.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[10px] font-bold tracking-[0.18em] transition-all ${
                active
                  ? "bg-indigo-100 text-indigo-700 shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              <NavIcon href={item.href} active={active} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
