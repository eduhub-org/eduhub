INSERT INTO "public"."CourseEnrollmentStatus" ("value", "comment")
VALUES ('EXPIRED', 'The invitation to the course has expired.')
ON CONFLICT ("value") DO NOTHING;
