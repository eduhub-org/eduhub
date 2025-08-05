alter table "public"."CourseFundingOrganization"
  add constraint "CourseFundingOrganization_organizationId_fkey"
  foreign key ("organizationId")
  references "public"."Organization"
  ("id") on update cascade on delete cascade; 