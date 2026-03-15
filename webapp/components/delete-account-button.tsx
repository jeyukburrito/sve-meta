"use client";

import { useFormStatus } from "react-dom";

export function DeleteAccountButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="rounded-full border border-danger/30 bg-danger/5 px-4 py-2 text-sm font-medium text-danger disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm("회원 탈퇴 시 모든 기록이 삭제됩니다. 계속하시겠습니까?")) {
          event.preventDefault();
        }
      }}
    >
      {pending ? "처리 중..." : "회원 탈퇴"}
    </button>
  );
}
