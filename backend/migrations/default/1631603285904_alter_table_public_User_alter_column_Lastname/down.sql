alter table "public"."User" rename column "lastName" to "Lastname";
comment on column "public"."User"."Lastname" is NULL;
