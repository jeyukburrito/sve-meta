"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(params)) {
        if (v) sp.set(k, v);
        else sp.delete(k);
      }
      window.gtag?.("event", "dashboard_filter", { period: params.period });
      router.push(`/dashboard?${sp.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-3">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {presets.map((p) => (
          <button
            key={p.value}
            type="button"
            aria-pressed={activePeriod === p.value}
            onClick={() => navigate({ period: p.value })}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activePeriod === p.value
                ? "bg-accent text-white shadow-[0_10px_20px_-8px_rgba(79,70,229,0.45)]"
                : "bg-paper text-ink"
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
        className="flex flex-wrap items-end gap-2 rounded-[28px] bg-surface-container-low p-3"
      >
        <label className="grid gap-1 text-xs text-muted">
          시작일
          <input
            type="date"
            name="from"
            defaultValue={defaultFrom}
            className="rounded-2xl bg-surface px-3 py-2 text-sm text-ink shadow-sm"
          />
        </label>
        <label className="grid gap-1 text-xs text-muted">
          종료일
          <input
            type="date"
            name="to"
            defaultValue={defaultTo}
            className="rounded-2xl bg-surface px-3 py-2 text-sm text-ink shadow-sm"
          />
        </label>
        <button
          type="submit"
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            activePeriod === "custom"
              ? "bg-accent text-white"
              : "bg-surface text-accent shadow-sm"
          }`}
        >
          적용
        </button>
      </form>
    </div>
  );
}
