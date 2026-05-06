alter table "public"."Project"
  add constraint "Project_parentProjectId_fkey"
  foreign key ("parentProjectId")
  references "public"."Project"
  ("id") on update restrict on delete set null;

CREATE INDEX "Project_parentProjectId_idx" ON "public"."Project" ("parentProjectId") WHERE "parentProjectId" IS NOT NULL;
