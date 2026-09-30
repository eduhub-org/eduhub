-- Deactivated postings have no status to return to once the value is gone.
UPDATE "public"."JobPosting"
SET "status" = 'ARCHIVED'
WHERE "status" = 'DEACTIVATED';

DELETE FROM "public"."JobPostingStatus"
WHERE "value" = 'DEACTIVATED';
