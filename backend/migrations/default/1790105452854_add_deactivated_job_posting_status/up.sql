INSERT INTO "public"."JobPostingStatus" ("value", "comment")
VALUES ('DEACTIVATED', 'Temporarily taken offline by the employer; can be reactivated until expiresAt')
ON CONFLICT ("value") DO NOTHING;
