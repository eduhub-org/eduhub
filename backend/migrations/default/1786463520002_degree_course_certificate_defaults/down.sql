-- Only the automation is reversed. The flag values set by step 1 of up.sql are left
-- as they are: the previous per-course values are not recoverable, and both values
-- are what a degree needs in either direction.
DROP TRIGGER IF EXISTS "set_degree_course_certificate_defaults_trg" ON "public"."Course";
DROP FUNCTION IF EXISTS "public"."set_degree_course_certificate_defaults"();
