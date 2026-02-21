-- Replace [User:Firstname] with [User:FirstName] in existing MailTemplate rows
-- (to match the placeholder casing used by the template renderer)
UPDATE "public"."MailTemplate"
SET "subject" = REPLACE("subject", '[User:Firstname]', '[User:FirstName]'),
    "content" = REPLACE("content", '[User:Firstname]', '[User:FirstName]'),
    "updated_at" = NOW()
WHERE "subject" LIKE '%[User:Firstname]%'
   OR "content" LIKE '%[User:Firstname]%';
