"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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

const VISIBLE_MS = 2500;
const FADE_OUT_MS = 300;

export function Toast() {
  const searchParams = useSearchParams();
  const [text, setText] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setDismissing(true);
    removeTimerRef.current = setTimeout(() => {
      setText(null);
      setDismissing(false);
    }, FADE_OUT_MS);
  }, []);

  useEffect(() => {
    const msg = searchParams.get("message");
    if (!msg || !MESSAGE_MAP[msg]) return;

    // 이전 타이머 정리
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);

    setText(MESSAGE_MAP[msg]);
    setDismissing(false);

    // URL에서 message 파라미터 제거
    const url = new URL(window.location.href);
    url.searchParams.delete("message");
    window.history.replaceState({}, "", url.toString());

    // 자동 사라짐 타이머
    fadeTimerRef.current = setTimeout(dismiss, VISIBLE_MS);
  }, [searchParams, dismiss]);

  if (!text) return null;

  return (
    <div
      className={`fixed bottom-20 left-1/2 z-50 -translate-x-1/2 ${
        dismissing
          ? "animate-[fadeOutDown_0.3s_ease-in_forwards]"
          : "animate-[fadeInUp_0.2s_ease-out]"
      }`}
    >
      <div className="rounded-2xl border border-accent/30 bg-surface px-5 py-3 text-sm font-medium text-accent shadow-lg">
        {text}
      </div>
    </div>
  );
}
