-- Remove REGISTERED status from CourseEnrollmentStatus enum
DELETE FROM "public"."CourseEnrollmentStatus" WHERE "value" = 'REGISTERED'; 