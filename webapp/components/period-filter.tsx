"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

type PeriodFilterProps = {
  activePeriod: string;
  defaultFrom?: string;
  defaultTo?: string;
};

const presets = [
  { label: "7일", value: "7d" },
  { label: "30일", value: "30d" },
  { label: "전체", value: "all" },
] as const;

export function PeriodFilter({ activePeriod, defaultFrom, defaultTo }: PeriodFilterProps) {
  const router = useRouter();

  const navigate = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v) sp.set(k, v);
      }
      window.gtag?.("event", "dashboard_filter", { period: params.period });
      router.push(`/dashboard?${sp.toString()}`);
    },
    [router],
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {presets.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => navigate({ period: p.value })}
            className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
              activePeriod === p.value
                ? "border-accent bg-accent text-white"
                : "border-line bg-white text-ink"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          navigate({
            period: "custom",
            from: fd.get("from") as string,
            to: fd.get("to") as string,
          });
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="grid gap-1 text-xs text-neutral-500">
          시작일
          <input
            type="date"
            name="from"
            defaultValue={defaultFrom}
            className="rounded-2xl border border-line px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="grid gap-1 text-xs text-neutral-500">
          종료일
          <input
            type="date"
            name="to"
            defaultValue={defaultTo}
            className="rounded-2xl border border-line px-3 py-2 text-sm text-ink"
          />
        </label>
        <button
          type="submit"
          className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
            activePeriod === "custom"
              ? "border-accent bg-accent text-white"
              : "border-accent bg-white text-accent"
          }`}
        >
          적용
        </button>
      </form>
    </div>
  );
}
