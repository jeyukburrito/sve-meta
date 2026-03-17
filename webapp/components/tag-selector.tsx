"use client";

import { useMemo, useState } from "react";

type TagOption = {
  id: string;
  name: string;
};

type TagSelectorProps = {
  tags: TagOption[];
  defaultSelectedIds?: string[];
  maxSelected?: number;
};

export function TagSelector({
  tags,
  defaultSelectedIds = [],
  maxSelected = 10,
}: TagSelectorProps) {
  const initialSelectedIds = useMemo(
    () => Array.from(new Set(defaultSelectedIds)).slice(0, maxSelected),
    [defaultSelectedIds, maxSelected],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  function toggleTag(tagId: string) {
    setSelectedIds((current) => {
      if (current.includes(tagId)) {
        return current.filter((id) => id !== tagId);
      }

      if (current.length >= maxSelected) {
        return current;
      }

      return [...current, tagId];
    });
  }

  if (tags.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-4 py-4 text-sm text-muted md:col-span-2">
        등록된 태그가 없습니다. 설정에서 태그를 먼저 추가해 주세요.
      </div>
    );
  }

  return (
    <fieldset className="grid gap-3 md:col-span-2">
      <legend className="text-sm font-medium">태그</legend>
      <p className="text-sm text-muted">
        최대 {maxSelected}개까지 선택할 수 있습니다. ({selectedIds.length}/{maxSelected})
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const checked = selectedIds.includes(tag.id);
          const disabled = !checked && selectedIds.length >= maxSelected;

          return (
            <label
              key={tag.id}
              className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-2 text-sm font-medium transition ${
                checked
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line bg-surface text-ink"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <input
                type="checkbox"
                name="tagIds"
                value={tag.id}
                checked={checked}
                disabled={disabled}
                onChange={() => toggleTag(tag.id)}
                className="sr-only"
              />
              #{tag.name}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
