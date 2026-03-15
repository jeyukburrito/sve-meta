-- CreateEnum
CREATE TYPE "TournamentPhase" AS ENUM ('swiss', 'elimination');

-- AlterTable
ALTER TABLE "match_results" ADD COLUMN "tournamentPhase" "TournamentPhase";

-- Backfill: existing shop/cs matches default to swiss
UPDATE "match_results" SET "tournamentPhase" = 'swiss' WHERE "eventCategory" IN ('shop', 'cs');

-- Enforce: friendly=NULL, shop/cs=NOT NULL
ALTER TABLE "match_results"
ADD CONSTRAINT chk_tournament_phase_category CHECK (
  ("eventCategory" IN ('shop', 'cs') AND "tournamentPhase" IS NOT NULL)
  OR ("eventCategory" = 'friendly' AND "tournamentPhase" IS NULL)
);
