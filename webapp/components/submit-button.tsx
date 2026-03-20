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
  className = "w-full rounded-[20px] bg-gradient-to-r from-primary to-primary-container px-5 py-4 text-base font-bold text-on-primary shadow-[0_12px_32px_-4px_rgba(81,63,198,0.3)] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={disabled || pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}
