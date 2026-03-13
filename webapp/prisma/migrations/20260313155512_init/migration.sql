-- CreateEnum
CREATE TYPE "PlayOrder" AS ENUM ('first', 'second');

-- CreateEnum
CREATE TYPE "MatchFormat" AS ENUM ('bo1', 'bo3');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ranked', 'shop', 'friendly', 'tournament');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decks" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "memo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_results" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "myDeckId" UUID NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "opponentDeckName" TEXT NOT NULL,
    "playOrder" "PlayOrder" NOT NULL,
    "matchFormat" "MatchFormat" NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "isMatchWin" BOOLEAN NOT NULL,
    "eventType" "EventType" NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_result_tags" (
    "matchResultId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "match_result_tags_pkey" PRIMARY KEY ("matchResultId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "decks_userId_isActive_idx" ON "decks"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "decks_userId_name_key" ON "decks"("userId", "name");

-- CreateIndex
CREATE INDEX "match_results_userId_playedAt_idx" ON "match_results"("userId", "playedAt");

-- CreateIndex
CREATE INDEX "match_results_userId_opponentDeckName_idx" ON "match_results"("userId", "opponentDeckName");

-- CreateIndex
CREATE INDEX "match_results_userId_playOrder_idx" ON "match_results"("userId", "playOrder");

-- CreateIndex
CREATE INDEX "match_results_userId_matchFormat_idx" ON "match_results"("userId", "matchFormat");

-- CreateIndex
CREATE UNIQUE INDEX "tags_userId_name_key" ON "tags"("userId", "name");

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_myDeckId_fkey" FOREIGN KEY ("myDeckId") REFERENCES "decks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_result_tags" ADD CONSTRAINT "match_result_tags_matchResultId_fkey" FOREIGN KEY ("matchResultId") REFERENCES "match_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_result_tags" ADD CONSTRAINT "match_result_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
