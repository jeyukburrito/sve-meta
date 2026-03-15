"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  disabled?: boolean;
  className?: string;
};

export function SubmitButton({
  label,
  pendingLabel = "처리 중...",
  disabled,
  className = "w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-400",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={disabled || pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}
