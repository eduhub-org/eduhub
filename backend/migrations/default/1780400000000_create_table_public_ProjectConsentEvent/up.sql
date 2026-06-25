CREATE TABLE "public"."ProjectConsentEvent" (
  "id" serial NOT NULL,
  "projectId" integer NOT NULL,
  "eventType" text NOT NULL,
  "actorUserId" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "termsVersion" text NOT NULL DEFAULT 'v1',
  PRIMARY KEY ("id"),
  FOREIGN KEY ("projectId")
    REFERENCES "public"."Project" ("id")
    ON UPDATE RESTRICT ON DELETE CASCADE,
  FOREIGN KEY ("actorUserId")
    REFERENCES "public"."User" ("id")
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT "ProjectConsentEvent_eventType_check"
    CHECK ("eventType" IN ('granted', 'withdrawn'))
);

COMMENT ON TABLE "public"."ProjectConsentEvent" IS
  E'Append-only log of publication-consent events for a project. Current consent state is derived: the project has active consent when the latest event has eventType = ''granted''. termsVersion records which version of the consent text was shown at the time of the action.';

CREATE INDEX "ProjectConsentEvent_projectId_created_at_idx"
  ON "public"."ProjectConsentEvent" ("projectId", "created_at" DESC);
