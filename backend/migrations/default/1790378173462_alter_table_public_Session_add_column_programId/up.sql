-- Program sessions: a session belongs either to one course (as before) or to
-- a whole program, in which case it is shown in every course of that program.
ALTER TABLE "public"."Session" ALTER COLUMN "courseId" DROP NOT NULL;

ALTER TABLE "public"."Session" ADD COLUMN "programId" integer NULL;

ALTER TABLE "public"."Session"
  ADD CONSTRAINT "Session_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "public"."Program"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."Session"
  ADD CONSTRAINT "Session_course_xor_program"
  CHECK (num_nonnulls("courseId", "programId") = 1);

CREATE INDEX "Session_programId_idx" ON "public"."Session" ("programId");

COMMENT ON COLUMN "public"."Session"."programId" IS 'Set for program-wide sessions (courseId is then NULL); shown in every course of the program';
