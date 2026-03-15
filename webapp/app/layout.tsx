import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Suspense, type ReactNode } from "react";

import { Analytics } from "@/components/analytics";
import { ThemeProvider } from "@/components/theme-provider";
import { Toast } from "@/components/toast";

import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TCG Match Tracker",
  description: "개인용 TCG 대전 기록 및 통계 웹앱",
};

const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={notoSansKR.className}>
        <ThemeProvider>
          <Suspense fallback={null}>
            <Analytics />
            <Toast />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
