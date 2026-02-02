-- Add termsAcceptedAt column to track when user accepted terms and privacy policy
ALTER TABLE "public"."CourseEnrollment"
ADD COLUMN "termsAcceptedAt" timestamptz;

COMMENT ON COLUMN "public"."CourseEnrollment"."termsAcceptedAt" IS 'Timestamp when user accepted Terms & Conditions and Privacy Policy during registration';
