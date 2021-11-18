comment on column "public"."MailTemplate"."Content" is E'The (html) text content of the email';
alter table "public"."MailTemplate" rename column "Content" to "content";
