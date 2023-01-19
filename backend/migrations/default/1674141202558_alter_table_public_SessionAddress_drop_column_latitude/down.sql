comment on column "public"."SessionAddress"."latitude" is E'One or several addresses for a session. When a new course is added all sessions will initially get the default address(es) provided in the course table.';
alter table "public"."SessionAddress" alter column "latitude" drop not null;
alter table "public"."SessionAddress" add column "latitude" text;
