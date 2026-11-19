-- Expert Directory (docs/EXPERT_DIRECTORY.md, ADR 0003): a "do not contact" mark on people,
-- dated notes about experts, and the date an expert was last active for sorting the directory.

ALTER TABLE "public"."User"
  ADD COLUMN "doNotContact" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."User"."doNotContact" IS
  E'The person objected to being contacted about new formats (Art. 21 GDPR). Set by admins and the org admins of their courses, removed only by admins.';

CREATE TABLE "public"."ExpertNote" (
  "id"             serial      NOT NULL,
  "expertId"       uuid        NOT NULL,
  "authorId"       uuid,
  "organizationId" integer,
  "text"           text        NOT NULL,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "updated_at"     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "ExpertNote_text_not_blank" CHECK (btrim("text") <> '')
);

COMMENT ON TABLE "public"."ExpertNote" IS
  E'A dated note an admin or org admin keeps about an expert. organizationId is null for notes of central admins (seen by admins only); otherwise the note is seen by that organization''s admins and by central admins.';

ALTER TABLE "public"."ExpertNote"
  ADD CONSTRAINT "ExpertNote_expertId_fkey"
  FOREIGN KEY ("expertId") REFERENCES "public"."User"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."ExpertNote"
  ADD CONSTRAINT "ExpertNote_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "public"."User"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "public"."ExpertNote"
  ADD CONSTRAINT "ExpertNote_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX "ExpertNote_expertId_idx" ON "public"."ExpertNote" ("expertId");
CREATE INDEX "ExpertNote_organizationId_idx" ON "public"."ExpertNote" ("organizationId");

CREATE TRIGGER "set_public_ExpertNote_updated_at"
BEFORE UPDATE ON "public"."ExpertNote"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

-- Last Active (CONTEXT.md): the date of the person's most recent expert role.
CREATE OR REPLACE FUNCTION "public"."user_expert_last_active_at"(user_row "public"."User")
RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$
  SELECT max(role_date) FROM (
    SELECT p."lectureStart"::timestamptz AS role_date
      FROM "public"."CourseInstructor" ci
      JOIN "public"."Course" c ON c."id" = ci."courseId"
      JOIN "public"."Program" p ON p."id" = c."programId"
     WHERE ci."userId" = user_row."id"
    UNION ALL
    SELECT s."startDateTime"
      FROM "public"."SessionSpeaker" ss
      JOIN "public"."Session" s ON s."id" = ss."sessionId"
     WHERE ss."userId" = user_row."id"
    UNION ALL
    SELECT pr."created_at"
      FROM "public"."ProjectMentor" pm
      JOIN "public"."Project" pr ON pr."id" = pm."projectId"
     WHERE pm."userId" = user_row."id"
    UNION ALL
    SELECT ao."created_at"
      FROM "public"."AchievementOptionMentor" aom
      JOIN "public"."AchievementOption" ao ON ao."id" = aom."achievementOptionId"
     WHERE aom."userId" = user_row."id"
  ) roles
$$;
