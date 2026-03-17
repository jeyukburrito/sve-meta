# PROJECT_RULES.md — Webapp 협업 운영 규칙

## 역할 분담

### Claude (PM + QA + Release/DevOps 리뷰)

**책임:**
- 요구사항 정리 및 MVP 범위 확정
- 작업 분해 (티켓 단위)
- Done Definition이 포함된 spec 작성 (`handoffs/T-xxx-spec.md`)
- Codex 구현 결과 검수 (`reviews/T-xxx-review.md`)
- 배포 전 체크리스트 작성

**금지:**
- 큰 기능을 직접 구현 (주 담당이 되지 않음)
- 여러 파일을 광범위하게 수정하는 실행 담당
- spec 없이 구현 지시
- 리뷰 단계에서 새 요구사항 추가
- 같은 티켓의 코드와 리뷰를 동시에 소유

### Codex (Frontend + Backend + Data 구현)

**책임:**
- `T-xxx-spec.md`만 기준으로 구현
- 구현 후 lint/test/build 결과 기록 (`handoffs/T-xxx-result.md`)
- 수정 파일 목록, 미완료 항목, 리스크를 솔직히 기록
- 범위 외 개선은 제안만 (자동 반영 금지)

**금지:**
- PRD를 임의 재해석하여 기능 추가
- spec에 없는 라이브러리 도입
- 대규모 리팩터링을 몰래 수행
- 실패한 테스트 숨기기
- Claude 리뷰 없이 "완료" 선언

### Orchestrator (사용자)

**책임:**
- 티켓 우선순위 결정
- Claude↔Codex 핸드오프 관리
- 최종 승인/반려, merge 결정
- 범위 변경 결정

**금지:**
- spec 없이 Codex를 바로 돌리기
- Claude와 Codex에게 같은 파일을 동시에 맡기기
- 리뷰 없이 merge
- 구두 요구사항 변경 후 파일 미반영

---

## 소통 방식

**핵심 원칙: 두 CLI가 서로 직접 대화하지 않고, 반드시 파일을 통해 구조화된 방식으로만 소통한다.**

- MCP 사용하지 않음
- 맥락 드리프트 방지, 책임 추적 가능, 리뷰 가능, 재현 가능

### 파일 소유권

| 담당 | 파일 |
|------|------|
| Claude | `PRD.md`, `TASKS.md`, `handoffs/T-xxx-spec.md`, `reviews/T-xxx-review.md` |
| Codex | `webapp/app/*`, `webapp/lib/*`, `webapp/components/*`, `webapp/prisma/*`, `handoffs/T-xxx-result.md` |

---

## 티켓 라이프사이클

```
1. Claude → spec 작성      (handoffs/T-xxx-spec.md)
2. 사용자 → spec 승인 후 Codex에 구현 지시
3. Codex  → 구현 + result 작성 (handoffs/T-xxx-result.md)
4. Claude → 리뷰 작성         (reviews/T-xxx-review.md)
5. 사용자 → 승인 or 재작업 지시
```

**완료 = "코드 작성"이 아니라 "검수 통과"**

---

## 운영 규칙

1. **한 티켓에는 하나의 기준 문서만** — 기준이 여러 개면 안 됨
2. **Claude는 명세·리뷰, Codex는 구현** — 역할 혼합 금지
3. **같은 파일을 두 CLI가 동시에 수정하지 않음** — 충돌 방지
4. **spec에는 Done Definition 필수** — 없으면 완료 판단 불가
5. **result에는 실패/리스크 필수** — 성공만 적는 문서는 무의미
6. **review는 새 요구사항 추가 문서가 아님** — 스펙 충족, 버그, 누락만
7. **범위 변경은 새 티켓으로 분리** — 기존 티켓에 끼워넣지 않음
8. **브랜치는 티켓 중심** — `feat/T-001-login-page` 형태 권장
9. **말로 한 변경도 파일에 반영** — 구두 변경 후 문서 업데이트 필수
10. **webapp 스코프 격리** — 관련 없는 저장소 영역으로 작업 확산 금지. 예외는 별도 티켓으로 명시

---

## 작성 원칙

- 구체적으로 쓸 것 — "적당히", "잘 처리" 같은 모호한 표현 금지
- 완료 기준은 관찰 가능한 형태로 정의
- 완료와 추정을 구분
- 실패와 리스크를 명시적으로 기록
- 재현 가능한 명령어와 안정적 파일 경로 사용
