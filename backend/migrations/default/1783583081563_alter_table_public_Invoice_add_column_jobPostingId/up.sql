-- A paid invoice may cover a job posting (StuJo) instead of a course
-- enrollment; exactly like courseEnrollmentId, it is a nullable reference.
ALTER TABLE "public"."Invoice"
  ADD COLUMN "jobPostingId" integer NULL;

ALTER TABLE "public"."Invoice"
  ADD CONSTRAINT "Invoice_jobPostingId_fkey"
  FOREIGN KEY ("jobPostingId") REFERENCES "public"."JobPosting"("id")
  ON UPDATE RESTRICT ON DELETE RESTRICT;

COMMENT ON COLUMN "public"."Invoice"."jobPostingId" IS 'Job posting this invoice covers (null for course invoices)';
