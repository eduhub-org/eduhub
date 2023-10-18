alter table "public"."AppSettings" drop constraint "AppSettings_pkey";
alter table "public"."AppSettings"
    add constraint "AppSettings_pkey"
    primary key ("id");
