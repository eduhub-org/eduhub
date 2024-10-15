alter table "public"."Organization"
  add constraint "Organization_type_fkey"
  foreign key ("type")
  references "public"."OrganizationType"
  ("value") on update restrict on delete restrict;
