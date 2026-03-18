# T-002 Review — 대시보드 이벤트 카테고리 필터 + 상성 매트릭스

## 결론: 승인 (수정 반영 후)

## QA 발견 이슈 및 처리

| # | 심각도 | 내용 | 처리 |
|---|--------|------|------|
| 1 | Critical | `page.tsx` title 한글 깨짐 (`??쒕낫??`) | ✅ 수정 완료 (`대시보드`) |
| 2 | Critical | `matchup-matrix.tsx` 테이블 뷰 "??" 텍스트 | ✅ 수정 완료 (`표본 부족`) |
| 3 | Major | `PeriodFilter` navigate 시 category 파라미터 초기화 | ✅ 수정 완료 (`useSearchParams` 보존) |

## DevOps 검토 결과

- DB 마이그레이션 없음 → 롤백 즉시 가능
- 신규 환경 변수 없음
- `(userId, eventCategory)` 인덱스 미존재 → 현재 규모 차단 아님, 향후 마이그레이션 권장
- 빌드 PASS (로컬 검증)

## Spec 대비 구현 완료 항목

- [x] FilterOptions category 타입 추가
- [x] buildWhereSql eventCategory 조건 (known values 가드 포함)
- [x] getMatchupMatrix 신규 함수 + bigint 변환
- [x] CategoryFilter (전체/친선/샵 대회/CS), URL 파라미터 동기화
- [x] MatchupMatrix 기본 뷰: 내 덱 탭 + 상대 덱 목록
- [x] MatchupMatrix 전체 보기 토글
- [x] 3전 미만 샘플 처리 (회색 + "표본 부족")
- [x] 빈 상태 처리
- [x] Promise.all 병렬 실행
