-- A preview enrollment: the row an instructor or admin creates on their own
-- course so they can see the participant view of it.
--
-- The participant surface is enforced server-side -- the CourseParticipant view,
-- the session online links and the whole project flow all key on the requesting
-- user holding a CONFIRMED enrollment -- so there is no way to show an
-- instructor what a participant sees other than giving them a real enrollment.
-- This flag is what keeps that real row from being treated as a real
-- participation anywhere else: it is excluded from both participant count
-- functions, from the CourseParticipant and DegreeParticipationStats views, from
-- the participant exports, from certificate runs, and from every enrollment
-- mail (the two event triggers on this table return early when it is set).
ALTER TABLE "public"."CourseEnrollment"
  ADD COLUMN "isTest" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."CourseEnrollment"."isTest" IS
  E'Preview enrollment an instructor or admin created on their own course to see the participant view. Never counted, listed, exported, certified or mailed about.';

-- Partial: test enrollments are a handful of rows in a large table, and every
-- consumer asks for the false side, which the planner reads off the table.
CREATE INDEX "CourseEnrollment_isTest_idx"
  ON "public"."CourseEnrollment" ("isTest") WHERE "isTest";
