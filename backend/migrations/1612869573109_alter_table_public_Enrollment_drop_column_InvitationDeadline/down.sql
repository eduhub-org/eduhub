ALTER TABLE "public"."Enrollment" ADD COLUMN "InvitationDeadline" date;
ALTER TABLE "public"."Enrollment" ALTER COLUMN "InvitationDeadline" DROP NOT NULL;
