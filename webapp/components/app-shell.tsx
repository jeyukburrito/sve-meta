import { ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { TopAppBar } from "@/components/top-app-bar";

type AppShellProps = {
  title: string;
  description?: string;
  headerRight?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, description, headerRight, children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-paper text-on-surface">
      <TopAppBar title={title} description={description} right={headerRight} />
      <main className="mx-auto w-full max-w-md px-4 py-5 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}
