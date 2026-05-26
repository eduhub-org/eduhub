ALTER TABLE "public"."Program"
  ADD CONSTRAINT "Program_defaultProjectType_fkey"
  FOREIGN KEY ("defaultProjectType")
  REFERENCES "public"."ProjectType" ("value")
  ON UPDATE RESTRICT ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS "Program_defaultProjectType_idx"
  ON "public"."Program" ("defaultProjectType")
  WHERE "defaultProjectType" IS NOT NULL;
