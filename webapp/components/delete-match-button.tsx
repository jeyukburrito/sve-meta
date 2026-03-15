"use client";

type DeleteMatchButtonProps = {
  label?: string;
};

export function DeleteMatchButton({ label = "삭제" }: DeleteMatchButtonProps) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm("이 기록을 삭제하시겠습니까?")) {
          event.preventDefault();
        } else {
          window.gtag?.("event", "match_delete_confirm");
        }
      }}
      className="rounded-full border border-danger/30 px-4 py-2 text-sm font-medium text-danger"
    >
      {label}
    </button>
  );
}
