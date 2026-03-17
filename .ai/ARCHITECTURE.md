# Architecture Notes

`webapp/`의 시스템 설계 결정 및 구현 제약을 기록한다.

포함 항목:
- 라우팅 구조
- 인증 흐름
- Server Action / Route Handler 경계
- Prisma 및 DB 컨벤션
- 검증 전략
- 프론트엔드/백엔드 소유권 경계

코드와 동기화된 상태를 유지할 것. 아키텍처가 크게 변경되면 같은 티켓 또는 후속 티켓에서 이 문서를 업데이트한다.
