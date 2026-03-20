export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-6 py-12 text-center text-ink">
      <div className="max-w-sm rounded-3xl border border-line bg-surface px-6 py-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Offline</p>
        <h1 className="mt-3 text-2xl font-semibold">오프라인 상태입니다</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          인터넷 연결을 확인한 뒤 다시 시도해주세요. 연결이 복구되면 최근 페이지로 돌아갈 수 있습니다.
        </p>
      </div>
    </div>
  );
}
