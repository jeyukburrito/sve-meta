"use client";

import { useState } from "react";

const PRESETS = [
  { label: "초록", value: "#0e6d53" },
  { label: "파랑", value: "#3b6fa0" },
  { label: "빨강", value: "#a33a2b" },
  { label: "보라", value: "#6b5b95" },
  { label: "주황", value: "#c07830" },
  { label: "분홍", value: "#b5585a" },
  { label: "청록", value: "#2e8b7a" },
  { label: "갈색", value: "#7a6352" },
  { label: "남색", value: "#2c3e6b" },
  { label: "회색", value: "#737373" },
];

type ColorPickerProps = {
  name: string;
  defaultValue?: string;
};

export function ColorPicker({ name, defaultValue }: ColorPickerProps) {
  const [selected, setSelected] = useState(defaultValue ?? "");

  return (
    <div className="grid gap-2 text-sm font-medium">
      대표 색상
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            title={preset.label}
            onClick={() => setSelected(preset.value === selected ? "" : preset.value)}
            className={`size-8 rounded-full border-2 transition-transform ${
              selected === preset.value
                ? "scale-110 border-ink"
                : "border-transparent hover:scale-105"
            }`}
            style={{ backgroundColor: preset.value }}
          />
        ))}
      </div>
      <input type="hidden" name={name} value={selected} />
    </div>
  );
}
