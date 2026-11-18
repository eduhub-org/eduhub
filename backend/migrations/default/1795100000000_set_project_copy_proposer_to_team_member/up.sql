-- A Project Copy's proposer is the team member who took on the template, not
-- the template's creator (see "Project Proposer" in CONTEXT.md). Until now
-- copyProjectFromTemplate copied the template's proposedByUserId, so the
-- template creator received every join-request email for every team.
--
-- Backfill: each copy's proposer becomes its earliest still-accepted team
-- member. proposedByUserId is NOT NULL, so a copy with no accepted member left
-- keeps its current proposer.
--
-- updated_at is left alone: the change is a correction, not an edit, and
-- public project sliders sort by updated_at.
ALTER TABLE "public"."Project" DISABLE TRIGGER "set_public_Project_updated_at";

UPDATE "public"."Project" AS p
SET "proposedByUserId" = first_member."userId"
FROM (
  SELECT DISTINCT ON (pa."projectId") pa."projectId", pa."userId"
  FROM "public"."ProjectAuthor" AS pa
  WHERE pa."participationStatus" = 'ACCEPTED'
  ORDER BY pa."projectId", pa."created_at", pa."id"
) AS first_member
WHERE p."parentProjectId" IS NOT NULL
  AND first_member."projectId" = p."id"
  AND p."proposedByUserId" IS DISTINCT FROM first_member."userId";

ALTER TABLE "public"."Project" ENABLE TRIGGER "set_public_Project_updated_at";

UPDATE "public"."MailTemplateType"
SET "comment" = 'Sent to the project team when a user requests to join; to mentors (or course instructors) only while the project has no team'
WHERE "value" = 'PROJECT_JOIN_REQUESTED';
