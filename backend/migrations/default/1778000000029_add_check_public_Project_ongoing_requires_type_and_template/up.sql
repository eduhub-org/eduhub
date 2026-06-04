alter table "public"."Project"
  add constraint "Project_ongoing_requires_type_and_template_check"
  check (
    "status" = 'PROPOSED'
    OR ("type" IS NOT NULL AND "documentationTemplateId" IS NOT NULL)
  );
COMMENT ON CONSTRAINT "Project_ongoing_requires_type_and_template_check" ON "public"."Project"
  IS 'Database-enforced rule: a project may only leave PROPOSED status (to ONGOING, SUBMITTED, COMPLETED, INCOMPLETE, or PUBLISHED) once both type and documentationTemplateId are set.';
