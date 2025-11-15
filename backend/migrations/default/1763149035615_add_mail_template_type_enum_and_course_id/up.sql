-- Create MailTemplateType ENUM table
CREATE TABLE "public"."MailTemplateType" ("value" text NOT NULL, "comment" text NOT NULL, PRIMARY KEY ("value") , UNIQUE ("value"));
COMMENT ON TABLE "public"."MailTemplateType" IS E'Types of mail templates available in the system';

-- Insert ENUM values
INSERT INTO "public"."MailTemplateType" ("value", "comment") VALUES 
  ('APPLICATION_RECEIVED', 'Sent when a user applies for a course'),
  ('APPLICATION_CONFIRMED', 'Sent when a user''s participation is confirmed'),
  ('SESSION_REMINDER', 'Sent before sessions start'),
  ('INVITE', 'Sent when admin invites users to a course'),
  ('DECLINE', 'Sent when admin rejects applications'),
  ('REGISTRATION_CONFIRMED', 'Sent when a user directly registers for a course/event');

-- Add courseId column (nullable, NOT unique)
ALTER TABLE "public"."MailTemplate" ADD COLUMN "courseId" integer NULL;

-- Remove unique constraint on title (we'll add it back on type+courseId combination)
ALTER TABLE "public"."MailTemplate" DROP CONSTRAINT IF EXISTS "MailTemplate_title_key";

-- Rename title column to type
ALTER TABLE "public"."MailTemplate" RENAME COLUMN "title" TO "type";

-- Update comment for type column
COMMENT ON COLUMN "public"."MailTemplate"."type" IS E'Mail template type';

-- Set courseId = -1 for all existing default templates
UPDATE "public"."MailTemplate" SET "courseId" = -1 WHERE "courseId" IS NULL;

-- Add unique constraint on (type, courseId) combination
ALTER TABLE "public"."MailTemplate" ADD CONSTRAINT "MailTemplate_type_courseId_key" UNIQUE ("type", "courseId");

