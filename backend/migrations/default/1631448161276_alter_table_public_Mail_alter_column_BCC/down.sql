alter table "public"."Mail" rename column "bcc" to "BCC";
comment on column "public"."Mail"."BCC" is NULL;
