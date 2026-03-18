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
  const colorClass = active ? "text-accent" : "text-muted";
  const common = `size-5 ${colorClass}`;

  if (href === "/matches/new") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (href === "/matches") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M6 7h12M6 12h12M6 17h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (href === "/dashboard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M5 18V9M12 18V5M19 18v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-7H9v7H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 border-t border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-4">
        {navigationItems.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-3.5 text-xs font-medium ${
                active ? "border-t-2 border-accent text-accent" : "text-muted"
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
