# Release Checklist

`webapp/` 배포 관련 변경 승인 전 확인 사항:

- [ ] 포함된 모든 티켓에 spec, result, review 파일 존재
- [ ] `TASKS.md`에서 해당 티켓 상태가 `done`
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과 (또는 예외 사유 문서화)
- [ ] 환경 변수 변경 또는 마이그레이션이 문서화됨
- [ ] 사용자 대면 텍스트/워크플로 변경이 리뷰됨
- [ ] 알려진 리스크가 result 또는 review에 기록됨
- [ ] 롤백 영향도 파악 완료
- [ ] Orchestrator 최종 승인 기록
