"use client";

import { useState } from "react";

type MatchResultInputProps = {
  defaultFormat?: string;
  defaultResult?: string;
};

export function MatchResultInput({
  defaultFormat = "bo1",
  defaultResult = "win",
}: MatchResultInputProps) {
  const [format, setFormat] = useState(defaultFormat);
  const [result, setResult] = useState<"win" | "lose">(
    defaultResult === "lose" ? "lose" : "win",
  );

  return (
    <section className="grid gap-4 rounded-3xl border border-line bg-surface p-4 shadow-sm">
      <div className="grid gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">
          Match Format
        </p>
        <div className="rounded-2xl border border-line bg-paper p-1.5">
          <input type="hidden" name="matchFormat" value={format} />
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setFormat("bo1")}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                format === "bo1" ? "bg-surface text-accent shadow-sm" : "text-muted"
              }`}
            >
              BO1
            </button>
            <button
              type="button"
              onClick={() => setFormat("bo3")}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                format === "bo3" ? "bg-surface text-accent shadow-sm" : "text-muted"
              }`}
            >
              BO3
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">Result</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setResult("win")}
            className={`rounded-2xl border px-4 py-4 text-base font-bold transition-all ${
              result === "win"
                ? "border-accent bg-accent/10 text-accent shadow-sm"
                : "border-line bg-paper text-muted"
            }`}
          >
            승리
          </button>
          <button
            type="button"
            onClick={() => setResult("lose")}
            className={`rounded-2xl border px-4 py-4 text-base font-bold transition-all ${
              result === "lose"
                ? "border-danger bg-danger/10 text-danger shadow-sm"
                : "border-line bg-paper text-muted"
            }`}
          >
            패배
          </button>
        </div>
        <input type="hidden" name="result" value={result} />
      </div>
    </section>
  );
}
