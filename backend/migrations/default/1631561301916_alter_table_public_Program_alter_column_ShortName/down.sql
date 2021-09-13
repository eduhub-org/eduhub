alter table "public"."Program" rename column "shortTitle" to "ShortName";
comment on column "public"."Program"."ShortName" is NULL;
