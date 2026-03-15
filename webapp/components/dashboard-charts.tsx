"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { DonutSlice } from "@/lib/dashboard";

const COLORS = [
  "#4f46e5",
  "#8f5a20",
  "#3b6fa0",
  "#dc2626",
  "#6b5b95",
  "#d8a347",
  "#2e8b7a",
  "#c06050",
  "#4a7c59",
  "#7a6352",
];

type DonutChartProps = {
  title: string;
  data: DonutSlice[];
  totalMatches: number;
};

function DonutChart({ title, data, totalMatches }: DonutChartProps) {
  if (data.length === 0) {
    return (
      <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-4 text-sm text-muted">표시할 데이터가 없습니다.</p>
      </article>
    );
  }

  return (
    <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 flex flex-col items-center gap-4 md:flex-row">
        <div className="h-56 w-56 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value}회 (${totalMatches > 0 ? Math.round((value / totalMatches) * 100) : 0}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center gap-3 text-sm">
              <span
                className="inline-block size-3 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="flex-1 truncate font-medium">{item.name}</span>
              <span className="text-muted">
                {item.value}회 · 승률 {item.rate}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

type DashboardChartsProps = {
  myDeckSlices: DonutSlice[];
  opponentSlices: DonutSlice[];
  totalMatches: number;
};

export function DashboardCharts({
  myDeckSlices,
  opponentSlices,
  totalMatches,
}: DashboardChartsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <DonutChart title="사용 덱 분포" data={myDeckSlices} totalMatches={totalMatches} />
      <DonutChart title="상대 덱 분포" data={opponentSlices} totalMatches={totalMatches} />
    </section>
  );
}
