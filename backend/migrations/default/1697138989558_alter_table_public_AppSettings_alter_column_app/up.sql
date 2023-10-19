comment on column "public"."AppSettings"."app" is E'Name of the app to which the given settings are applied';
alter table "public"."AppSettings" rename column "app" to "appName";
