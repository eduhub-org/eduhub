alter table "public"."Project"
  add constraint "Project_rating_fkey"
  foreign key ("rating")
  references "public"."ProjectRating"
  ("value") on update restrict on delete restrict;
