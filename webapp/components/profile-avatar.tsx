import Link from "next/link";

type ProfileAvatarProps = {
  avatarUrl?: string | null;
  name?: string | null;
};

export function ProfileAvatar({ avatarUrl, name }: ProfileAvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() ?? null;

  return (
    <Link
      href="/settings/profile"
      className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/10 text-accent transition-shadow hover:ring-2 hover:ring-accent/30"
      aria-label="프로필"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          width={32}
          height={32}
          className="size-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : initial ? (
        <span className="text-sm font-semibold">{initial}</span>
      ) : (
        <svg viewBox="0 0 32 32" className="size-5" fill="currentColor">
          <circle cx="16" cy="12" r="5" />
          <path d="M6 28c0-5.523 4.477-10 10-10s10 4.477 10 10" />
        </svg>
      )}
    </Link>
  );
}
