-- Drop indexes first
DROP INDEX IF EXISTS "public"."EnrollmentAddon_enrollmentId_idx";
DROP INDEX IF EXISTS "public"."EnrollmentAddon_addonMappingId_idx";

-- Drop EnrollmentAddon table
DROP TABLE IF EXISTS "public"."EnrollmentAddon";
