-- CreateTable
CREATE TABLE "games" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "games_userId_idx" ON "games"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "games_userId_name_key" ON "games"("userId", "name");

-- AddColumn
ALTER TABLE "decks" ADD COLUMN "gameId" UUID;

-- Seed default game for every user
INSERT INTO "games" ("id", "userId", "name", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", 'Shadowverse EVOLVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u
WHERE NOT EXISTS (
  SELECT 1
  FROM "games" g
  WHERE g."userId" = u."id"
    AND g."name" = 'Shadowverse EVOLVE'
);

-- Backfill decks to default game
UPDATE "decks" d
SET "gameId" = g."id"
FROM "games" g
WHERE g."userId" = d."userId"
  AND g."name" = 'Shadowverse EVOLVE'
  AND d."gameId" IS NULL;

-- Make gameId required
ALTER TABLE "decks" ALTER COLUMN "gameId" SET NOT NULL;

-- Replace indexes
DROP INDEX "decks_userId_isActive_idx";
DROP INDEX "decks_userId_name_key";

CREATE INDEX "decks_userId_gameId_isActive_idx" ON "decks"("userId", "gameId", "isActive");
CREATE UNIQUE INDEX "decks_userId_gameId_name_key" ON "decks"("userId", "gameId", "name");

-- ForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "decks" ADD CONSTRAINT "decks_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
