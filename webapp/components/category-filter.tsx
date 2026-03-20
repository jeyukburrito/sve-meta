"use client";

import { useRouter, useSearchParams } from "next/navigation";

type CategoryFilterProps = {
  activeCategory?: string;
};

const CATEGORIES = [
  { label: "전체", value: "all" },
  { label: "친선", value: "friendly" },
  { label: "매장대회", value: "shop" },
  { label: "CS", value: "cs" },
] as const;

export function CategoryFilter({ activeCategory = "all" }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (nextCategory: string) => {
    const sp = new URLSearchParams(searchParams.toString());

    if (nextCategory === "all") {
      sp.delete("category");
    } else {
      sp.set("category", nextCategory);
    }

    router.push(`/dashboard${sp.toString() ? `?${sp.toString()}` : ""}`);
  };

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {CATEGORIES.map((item) => {
        const isActive = activeCategory === item.value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => handleSelect(item.value)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? "bg-accent text-white shadow-[0_10px_20px_-8px_rgba(79,70,229,0.45)]"
                : "bg-paper text-ink"
            }`}
            aria-pressed={isActive}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
