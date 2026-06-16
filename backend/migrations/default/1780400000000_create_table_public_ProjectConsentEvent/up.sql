CREATE TABLE "public"."ProjectConsentEvent" (
  "id" serial NOT NULL,
  "project_id" integer NOT NULL,
  "event_type" text NOT NULL,
  "actor_user_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "terms_version" text NOT NULL DEFAULT 'v1',
  PRIMARY KEY ("id"),
  FOREIGN KEY ("project_id")
    REFERENCES "public"."Project" ("id")
    ON UPDATE RESTRICT ON DELETE CASCADE,
  FOREIGN KEY ("actor_user_id")
    REFERENCES "public"."User" ("id")
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT "ProjectConsentEvent_event_type_check"
    CHECK ("event_type" IN ('granted', 'withdrawn'))
);

COMMENT ON TABLE "public"."ProjectConsentEvent" IS
  E'Append-only log of publication-consent events for a project. '
  E'Current consent state is derived: the project has active consent when the latest event has event_type = ''granted''. '
  E'terms_version records which version of the consent text was shown at the time of the action.';

CREATE INDEX "ProjectConsentEvent_project_id_created_at_idx"
  ON "public"."ProjectConsentEvent" ("project_id", "created_at" DESC);
