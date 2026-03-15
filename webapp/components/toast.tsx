"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const MESSAGE_MAP: Record<string, string> = {
  record_created: "대전 결과를 저장했습니다.",
  record_updated: "대전 결과를 수정했습니다.",
  record_deleted: "대전 결과를 삭제했습니다.",
  "덱을 추가했습니다.": "덱을 추가했습니다.",
  "덱을 다시 활성화했습니다.": "덱을 다시 활성화했습니다.",
  "덱을 비활성화했습니다.": "덱을 비활성화했습니다.",
  "카드게임 카테고리를 추가했습니다.": "카드게임을 추가했습니다.",
  "카드게임 이름을 수정했습니다.": "카드게임 이름을 수정했습니다.",
  "카드게임 카테고리를 삭제했습니다.": "카드게임을 삭제했습니다.",
};

export function Toast() {
  const searchParams = useSearchParams();
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const msg = searchParams.get("message");
    if (msg && MESSAGE_MAP[msg]) {
      setText(MESSAGE_MAP[msg]);
      const url = new URL(window.location.href);
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.toString());
      const timer = setTimeout(() => setText(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!text) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-[fadeInUp_0.2s_ease-out]">
      <div className="rounded-2xl border border-accent/30 bg-white px-5 py-3 text-sm font-medium text-accent shadow-lg">
        {text}
      </div>
    </div>
  );
}
