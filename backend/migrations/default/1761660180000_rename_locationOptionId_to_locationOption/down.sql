-- Revert: Rename locationOption back to locationOptionId in LocationAddress table

ALTER TABLE "public"."LocationAddress" 
RENAME COLUMN "locationOption" TO "locationOptionId";

-- Restore the original comment
COMMENT ON COLUMN "public"."LocationAddress"."locationOptionId" IS 
E'Foreign key to LocationOption. Each address must belong to exactly one location option.';

