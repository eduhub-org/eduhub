comment on column "public"."SessionAddress"."location" is E'One or several addresses for a session. When a new course is added all sessions will initially get the default address(es) provided in the course table.';
alter table "public"."SessionAddress"
  add constraint "SessionAddress_location_fkey"
  foreign key (location)
  references "public"."LocationOption"
  (value) on update restrict on delete restrict;
alter table "public"."SessionAddress" alter column "location" drop not null;
alter table "public"."SessionAddress" add column "location" text;
