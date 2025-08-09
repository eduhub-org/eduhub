alter table "public"."CourseFundingOrganization"
  add constraint "CourseFundingOrganization_courseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update cascade on delete cascade; 