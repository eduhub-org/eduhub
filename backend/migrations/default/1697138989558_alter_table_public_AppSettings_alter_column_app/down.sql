alter table "public"."AppSettings" rename column "appName" to "app";
comment on column "public"."AppSettings"."app" is NULL;
