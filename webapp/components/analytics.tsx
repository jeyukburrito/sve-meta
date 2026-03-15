"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const FLASH_EVENT_MAP: Record<string, string> = {
  // matches
  record_created: "match_create",
  record_updated: "match_update",
  record_deleted: "match_delete",
  // decks
  "덱을 추가했습니다.": "deck_create",
  "덱을 다시 활성화했습니다.": "deck_toggle",
  "덱을 비활성화했습니다.": "deck_toggle",
  // games
  "카드게임 카테고리를 추가했습니다.": "game_create",
  "카드게임 이름을 수정했습니다.": "game_update",
  "카드게임 카테고리를 삭제했습니다.": "game_delete",
};

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID) return;
    window.gtag("event", "page_view", { page_path: pathname });
  }, [pathname]);

  useEffect(() => {
    if (!GA_ID) return;
    const msg = searchParams.get("message");
    if (msg && FLASH_EVENT_MAP[msg]) {
      window.gtag("event", FLASH_EVENT_MAP[msg]);
      const url = new URL(window.location.href);
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false});`}
      </Script>
    </>
  );
}
