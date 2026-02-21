-- Reverse: replace [User:FirstName] back to [User:Firstname]
UPDATE "public"."MailTemplate"
SET "subject" = REPLACE("subject", '[User:FirstName]', '[User:Firstname]'),
    "content" = REPLACE("content", '[User:FirstName]', '[User:Firstname]'),
    "updated_at" = NOW()
WHERE "subject" LIKE '%[User:FirstName]%'
   OR "content" LIKE '%[User:FirstName]%';
