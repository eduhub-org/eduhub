ALTER TABLE "public"."Project"
  ADD CONSTRAINT "Project_submittedBy_fkey"
  FOREIGN KEY ("submittedBy")
  REFERENCES "public"."User" ("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "Project_submittedBy_idx"
  ON "public"."Project" ("submittedBy")
  WHERE "submittedBy" IS NOT NULL;
