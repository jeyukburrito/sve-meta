# T-006 Spec — 백엔드 안전성 개선

## 목적

QA 진단에서 발견된 3건의 백엔드 안전성 이슈를 수정한다.
모두 기존 기능의 방어 로직 보강이며, 새 기능 추가 없음.

---

## 1. 계정 삭제 순서 수정 (Critical)

### 현재 문제

`app/settings/profile/actions.ts` — Prisma DB 삭제 → Supabase auth 삭제 순서.
Supabase 삭제 실패 시 DB 데이터는 이미 삭제되어 orphan auth user 발생.
재로그인 시 `ensureUserProfile()`이 빈 프로필을 다시 생성하는 "유령 계정" 문제.

### 변경 내용

삭제 순서를 **Supabase auth 먼저 → 성공 시 Prisma DB 삭제**로 변경.
실패 시 사용자에게 에러 redirect.

```ts
export async function deleteAccount() {
  const user = await requireUser();
  const admin = createAdminClient();
  const supabase = await createClient();

  // 1. Supabase auth 삭제 먼저 (point of no return)
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    redirect("/settings/profile?error=delete_failed");
  }

  // 2. auth 삭제 성공 후 DB 삭제
  await prisma.user.delete({
    where: { id: user.id },
  });

  await supabase.auth.signOut();
  redirect("/login?message=account_deleted");
}
```

- `throw new Error()` 대신 `redirect("/settings/profile?error=delete_failed")` 사용 (기존 에러 패턴 준수)
- Supabase 삭제 성공 후 Prisma 삭제 실패 시: auth는 이미 삭제되었으므로 로그인 불가 → 안전한 방향

---

## 2. playedAt 날짜 검증 강화 (Medium)

### 현재 문제

`lib/validation/match.ts` — `playedAt: z.string().min(1)` 으로 빈 문자열만 차단.
ISO 날짜 형식(`YYYY-MM-DD`) 미검증. FormData 직접 조작 시 Invalid Date가 DB에 삽입될 수 있음.

### 변경 내용

`playedAt` 검증을 ISO date format regex로 강화:

```ts
playedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
```

기존 `z.string().min(1)` → `z.string().regex(...)` 교체. 다른 필드 변경 없음.

---

## 3. Tournament End 결과 확인 (Medium)

### 현재 문제

`app/matches/tournaments/end/route.ts` — `updateMany` 후 result count 미확인.
존재하지 않거나 이미 종료된 세션에 대해서도 "종료 완료" 성공 메시지 표시.

### 변경 내용

`updateMany` 결과의 `count`를 확인하고, 0이면 에러 redirect:

```ts
const result = await prisma.tournamentSession.updateMany({
  where: {
    id: tournamentSessionId,
    userId: user.id,
    endedAt: null,
  },
  data: {
    endedAt: new Date(),
  },
});

if (result.count === 0) {
  return NextResponse.redirect(
    new URL("/matches?error=tournament_not_found", request.url)
  );
}

revalidatePath("/matches");
revalidatePath("/matches/new");
revalidatePath("/dashboard");

return NextResponse.redirect(
  new URL("/matches?message=tournament_ended", request.url)
);
```

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `app/settings/profile/actions.ts` | 삭제 순서 역전 (Supabase 먼저), 실패 시 에러 redirect |
| `lib/validation/match.ts` | `playedAt` regex 검증 추가 |
| `app/matches/tournaments/end/route.ts` | `updateMany` result count 확인, 0이면 에러 redirect |

기타 파일 변경 없음.

---

## 비기능 요건

- TypeScript 오류 0, ESLint 오류 0
- `npm run build` 통과
- 기존 매치 생성/수정/삭제 기능 동작 변경 없음
- 기존 대회 세션 생성/연결 기능 동작 변경 없음
- DB 마이그레이션 없음

---

## 범위 외 (Out of Scope)

- TournamentSession 중복 방지 unique constraint (별도 티켓)
- DB 인덱스 추가 (별도 티켓)
- revalidatePath 정리 (별도 티켓)
- Tournament end를 Server Action으로 전환
- Soft delete 도입
