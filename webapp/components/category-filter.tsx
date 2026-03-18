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
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((item) => {
        const isActive = activeCategory === item.value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => handleSelect(item.value)}
            className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-accent bg-accent text-white"
                : "border-line bg-surface text-ink"
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
