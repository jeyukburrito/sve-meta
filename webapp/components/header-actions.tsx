import { ProfileAvatar } from "@/components/profile-avatar";
import { ThemeToggle } from "@/components/theme-toggle";

type HeaderActionsProps = {
  avatarUrl?: string | null;
  name?: string | null;
};

export function HeaderActions({ avatarUrl, name }: HeaderActionsProps) {
  return (
    <>
      <ThemeToggle />
      <ProfileAvatar avatarUrl={avatarUrl} name={name} />
    </>
  );
}
