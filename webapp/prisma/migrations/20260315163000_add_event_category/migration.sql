CREATE TYPE "EventCategory" AS ENUM ('friendly', 'shop', 'cs');

ALTER TABLE "match_results"
ADD COLUMN "eventCategory" "EventCategory" NOT NULL DEFAULT 'friendly';
