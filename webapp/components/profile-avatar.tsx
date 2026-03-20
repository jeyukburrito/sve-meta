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
      className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-fixed text-primary transition-all hover:scale-[0.98] hover:bg-primary-fixed-dim/70"
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
        <span className="text-sm font-bold">{initial}</span>
      ) : (
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          account_circle
        </span>
      )}
    </Link>
  );
}
