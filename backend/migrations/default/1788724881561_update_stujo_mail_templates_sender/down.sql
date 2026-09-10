UPDATE "public"."MailTemplate"
  SET "from" = 'noreply@stujo.net', "updated_at" = NOW()
  WHERE "from" = 'team@stujo.net';
