import { ProfileAvatar } from "@/components/profile-avatar";
import { ThemeToggle } from "@/components/theme-toggle";

type HeaderActionsProps = {
  avatarUrl?: string | null;
  name?: string | null;
};

export function HeaderActions({ avatarUrl, name }: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-surface-container-low px-1.5 py-1 shadow-float">
      <ThemeToggle />
      <ProfileAvatar avatarUrl={avatarUrl} name={name} />
    </div>
  );
}
