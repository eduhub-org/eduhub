comment on column "public"."SessionAddress"."link" is E'One or several addresses for a session. When a new course is added all sessions will initially get the default address(es) provided in the course table.';
alter table "public"."SessionAddress" alter column "link" drop not null;
alter table "public"."SessionAddress" add column "link" text;
