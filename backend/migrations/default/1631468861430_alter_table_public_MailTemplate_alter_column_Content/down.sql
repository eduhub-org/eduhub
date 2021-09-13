alter table "public"."MailTemplate" rename column "content" to "Content";
comment on column "public"."MailTemplate"."Content" is NULL;
