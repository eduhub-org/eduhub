ALTER TABLE "public"."Badge" ADD COLUMN "order" integer NOT NULL DEFAULT 0;
ALTER TABLE "public"."Badge" ADD COLUMN "organizationId" integer NULL;
ALTER TABLE "public"."Badge"
  ADD CONSTRAINT "Badge_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;
CREATE INDEX "Badge_organizationId_idx" ON "public"."Badge" ("organizationId");
