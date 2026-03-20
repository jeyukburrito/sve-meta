import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Suspense, type ReactNode } from "react";

import { Analytics } from "@/components/analytics";
import { ServiceWorkerRegistration } from "@/components/service-worker";
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
  description: "개인 TCG 대전 기록 및 통계 웹앱",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TCG Tracker",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4f46e5",
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
            <ServiceWorkerRegistration />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
