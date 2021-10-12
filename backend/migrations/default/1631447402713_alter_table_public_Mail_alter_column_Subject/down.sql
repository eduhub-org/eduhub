alter table "public"."Mail" rename column "subject" to "Subject";
comment on column "public"."Mail"."Subject" is NULL;
