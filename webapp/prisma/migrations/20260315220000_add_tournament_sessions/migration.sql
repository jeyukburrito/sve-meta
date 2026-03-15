CREATE TABLE "tournament_sessions" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "myDeckId" UUID NOT NULL,
  "eventCategory" "EventCategory" NOT NULL,
  "playedOn" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tournament_sessions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "match_results"
ADD COLUMN "tournamentSessionId" UUID;

ALTER TABLE "tournament_sessions"
ADD CONSTRAINT "tournament_sessions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tournament_sessions"
ADD CONSTRAINT "tournament_sessions_myDeckId_fkey"
FOREIGN KEY ("myDeckId") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "match_results"
ADD CONSTRAINT "match_results_tournamentSessionId_fkey"
FOREIGN KEY ("tournamentSessionId") REFERENCES "tournament_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "tournament_sessions_userId_playedOn_eventCategory_idx"
ON "tournament_sessions"("userId", "playedOn", "eventCategory");

CREATE INDEX "tournament_sessions_userId_endedAt_idx"
ON "tournament_sessions"("userId", "endedAt");

CREATE INDEX "match_results_userId_tournamentSessionId_idx"
ON "match_results"("userId", "tournamentSessionId");

WITH grouped AS (
  SELECT
    gen_random_uuid() AS session_id,
    m."userId",
    m."myDeckId",
    m."eventCategory",
    date_trunc('day', m."playedAt") AS played_on
  FROM "match_results" m
  WHERE m."eventCategory" IN ('shop', 'cs')
  GROUP BY m."userId", m."myDeckId", m."eventCategory", date_trunc('day', m."playedAt")
),
inserted AS (
  INSERT INTO "tournament_sessions" (
    "id",
    "userId",
    "myDeckId",
    "eventCategory",
    "playedOn",
    "endedAt"
  )
  SELECT
    g.session_id,
    g."userId",
    g."myDeckId",
    g."eventCategory",
    g.played_on,
    CURRENT_TIMESTAMP
  FROM grouped g
  RETURNING "id", "userId", "myDeckId", "eventCategory", "playedOn"
)
UPDATE "match_results" m
SET "tournamentSessionId" = i."id"
FROM inserted i
WHERE m."userId" = i."userId"
  AND m."myDeckId" = i."myDeckId"
  AND m."eventCategory" = i."eventCategory"
  AND date_trunc('day', m."playedAt") = i."playedOn";
