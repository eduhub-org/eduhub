comment on column "public"."SessionAddress"."type" is E'One or several addresses for a session. When a new course is added all sessions will initially get the default address(es) provided in the course table.';
alter table "public"."SessionAddress" alter column "type" set default ''FREETEXT_ADDRESS'::text';
alter table "public"."SessionAddress"
  add constraint "SessionAddress_type_fkey"
  foreign key (type)
  references "public"."SessionAddressType"
  (value) on update restrict on delete restrict;
alter table "public"."SessionAddress" alter column "type" drop not null;
alter table "public"."SessionAddress" add column "type" text;
