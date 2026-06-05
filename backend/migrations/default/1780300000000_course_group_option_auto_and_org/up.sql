-- Extend CourseGroupOption to support automatically populated (program-type based)
-- slider groups and organization-owned groups that are only used in widgets.

ALTER TABLE "public"."CourseGroupOption"
  ADD COLUMN "programType" text NULL,
  ADD COLUMN "organizationId" integer NULL;

COMMENT ON COLUMN "public"."CourseGroupOption"."programType" IS E'When set, this group automatically includes all published courses of the given program type (e.g. COURSES, EVENTS, DEGREES) instead of relying on manual CourseGroup assignments.';
COMMENT ON COLUMN "public"."CourseGroupOption"."organizationId" IS E'When set, this group is owned by the given organization. Organization-owned groups are not shown on the public homepage but can be selected in that organization''s course widget.';

ALTER TABLE "public"."CourseGroupOption"
  ADD CONSTRAINT "CourseGroupOption_programType_fkey"
  FOREIGN KEY ("programType") REFERENCES "public"."ProgramType"("value") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "public"."CourseGroupOption"
  ADD CONSTRAINT "CourseGroupOption_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;

-- Map the existing type-based slider groups to their program type so that they
-- are populated automatically from now on.
UPDATE "public"."CourseGroupOption" SET "programType" = 'EVENTS' WHERE "title" = 'event';
UPDATE "public"."CourseGroupOption" SET "programType" = 'DEGREES' WHERE "title" = 'degree';

-- Add the new automatically populated "Courses" slider group.
SELECT setval(
  pg_get_serial_sequence('"public"."CourseGroupOption"', 'id'),
  (SELECT COALESCE(MAX("id"), 1) FROM "public"."CourseGroupOption")
);

INSERT INTO "public"."CourseGroupOption" ("title", "order", "sliderGroup", "programType")
VALUES ('courses', (SELECT COALESCE(MAX("order"), 0) + 1 FROM "public"."CourseGroupOption"), true, 'COURSES')
ON CONFLICT ("title") DO UPDATE SET "programType" = 'COURSES', "sliderGroup" = true;
