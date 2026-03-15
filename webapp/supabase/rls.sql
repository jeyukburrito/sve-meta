alter table public.users enable row level security;
alter table public.games enable row level security;
alter table public.decks enable row level security;
alter table public.match_results enable row level security;
alter table public.tags enable row level security;
alter table public.match_result_tags enable row level security;

drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "games_manage_own" on public.games;
drop policy if exists "decks_manage_own" on public.decks;
drop policy if exists "match_results_manage_own" on public.match_results;
drop policy if exists "tags_manage_own" on public.tags;
drop policy if exists "match_result_tags_manage_own" on public.match_result_tags;

create policy "users_select_own"
  on public.users
  for select
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users
  for update
  using (auth.uid() = id);

create policy "users_insert_own"
  on public.users
  for insert
  with check (auth.uid() = id);

create policy "games_manage_own"
  on public.games
  for all
  using (auth.uid() = "userId")
  with check (auth.uid() = "userId");

create policy "decks_manage_own"
  on public.decks
  for all
  using (auth.uid() = "userId")
  with check (auth.uid() = "userId");

create policy "match_results_manage_own"
  on public.match_results
  for all
  using (auth.uid() = "userId")
  with check (auth.uid() = "userId");

create policy "tags_manage_own"
  on public.tags
  for all
  using (auth.uid() = "userId")
  with check (auth.uid() = "userId");

create policy "match_result_tags_manage_own"
  on public.match_result_tags
  for all
  using (
    exists (
      select 1
      from public.match_results mr
      where mr.id = "matchResultId"
        and mr."userId" = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.match_results mr
      where mr.id = "matchResultId"
        and mr."userId" = auth.uid()
    )
    and exists (
      select 1
      from public.tags t
      where t.id = "tagId"
        and t."userId" = auth.uid()
    )
  );
