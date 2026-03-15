ALTER TABLE "match_results"
ADD COLUMN "didChoosePlayOrder" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "match_results"
DROP COLUMN "eventType";

DROP TYPE "EventType";
