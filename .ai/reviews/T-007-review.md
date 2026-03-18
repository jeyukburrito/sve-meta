# T-007 Review — 앱 성능 최적화

**상태**: APPROVE
**리뷰일**: 2026-03-18

---

## 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| `force-dynamic` 제거 (12개 파일) | PASS | 전부 삭제 확인 |
| Recharts dynamic import | PASS | `next/dynamic` 적용, lazy-load 동작 |
| `next/image` 적용 | PASS | `unoptimized` 포함, CLS 방지 |
| 범위 외 변경 없음 | PASS | spec 범위 내 변경만 |
| `npm run build` 통과 | PASS | TS/ESLint 오류 0 |

## 참고

- `ssr: false` 옵션은 Next.js 15 Server Component 제약으로 사용 불가하여 생략됨
- Recharts 번들 lazy-load는 옵션 없이도 정상 작동 → 성능 목표 달성
