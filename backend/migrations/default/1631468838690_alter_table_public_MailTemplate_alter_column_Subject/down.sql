alter table "public"."MailTemplate" rename column "subject" to "Subject";
comment on column "public"."MailTemplate"."Subject" is NULL;
