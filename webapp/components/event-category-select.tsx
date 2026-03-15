"use client";

import { useState } from "react";

type EventCategorySelectProps = {
  defaultValue?: string;
};

const CATEGORIES = [
  { value: "friendly", label: "친선전", icon: "⚔️" },
  { value: "shop", label: "매장대회", icon: "🏪" },
  { value: "cs", label: "CS", icon: "🏆" },
] as const;

export function EventCategorySelect({ defaultValue = "friendly" }: EventCategorySelectProps) {
  const [selected, setSelected] = useState(defaultValue);

  return (
    <div className="grid gap-2 text-sm font-medium md:col-span-2">
      대회 분류
      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setSelected(cat.value)}
            className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${
              selected === cat.value
                ? "border-accent bg-accent/10 text-accent"
                : "border-line text-muted"
            }`}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="eventCategory" value={selected} />
      {selected !== "friendly" ? (
        <p className="text-xs text-muted">
          대회 기록은 저장 후 다음 라운드를 이어서 입력할 수 있습니다.
        </p>
      ) : null}
    </div>
  );
}
