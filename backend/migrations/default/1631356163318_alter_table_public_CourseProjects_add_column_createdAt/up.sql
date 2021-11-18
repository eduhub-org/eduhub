alter table "public"."CourseProjects" add column "createdAt" timestamptz
 null default now();
