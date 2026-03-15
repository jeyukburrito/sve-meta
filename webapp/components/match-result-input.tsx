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
    <>
      <label className="grid gap-2 text-sm font-medium">
        경기 형식
        <select
          name="matchFormat"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="rounded-2xl border border-line px-4 py-3"
          required
        >
          <option value="bo1">BO1</option>
          <option value="bo3">BO3</option>
        </select>
      </label>
      <div className="grid gap-2 text-sm font-medium">
        결과
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setResult("win")}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
              result === "win"
                ? "border-accent bg-accent/10 text-accent"
                : "border-line text-neutral-500"
            }`}
          >
            승리
          </button>
          <button
            type="button"
            onClick={() => setResult("lose")}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
              result === "lose"
                ? "border-danger bg-danger/10 text-danger"
                : "border-line text-neutral-500"
            }`}
          >
            패배
          </button>
        </div>
        <input type="hidden" name="result" value={result} />
      </div>
    </>
  );
}
