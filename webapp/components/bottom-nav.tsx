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
              className={`px-3 py-3 text-center text-sm font-medium ${
                active
                  ? "border-t-2 border-accent text-accent"
                  : "text-muted"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
