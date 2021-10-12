comment on column "public"."Mail"."BCC" is E'Mail adressess that are receiving a blind carbon copy';
alter table "public"."Mail" rename column "BCC" to "bcc";
