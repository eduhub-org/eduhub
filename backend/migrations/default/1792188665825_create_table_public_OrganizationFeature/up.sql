-- Optional functionality that a super admin unlocks per organization. Nothing
-- here is available to an organization until a row exists for it; only the
-- admin role (full access) can insert or delete rows.
CREATE TABLE "public"."OrganizationFeatureOption" (
  "value"   text NOT NULL,
  "comment" text NOT NULL,
  PRIMARY KEY ("value")
);

COMMENT ON TABLE "public"."OrganizationFeatureOption" IS E'Features a super admin can activate for an organization';

INSERT INTO "public"."OrganizationFeatureOption" ("value", "comment") VALUES
  ('RAUSGEGANGEN', 'Publish events on rausgegangen.de');

CREATE TABLE "public"."OrganizationFeature" (
  "id"             serial      NOT NULL,
  "organizationId" integer     NOT NULL,
  "feature"        text        NOT NULL,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "updated_at"     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "OrganizationFeature_organizationId_feature_key" UNIQUE ("organizationId", "feature")
);

COMMENT ON TABLE "public"."OrganizationFeature" IS E'A feature activated for an organization by a super admin';

ALTER TABLE "public"."OrganizationFeature"
  ADD CONSTRAINT "OrganizationFeature_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."OrganizationFeature"
  ADD CONSTRAINT "OrganizationFeature_feature_fkey"
  FOREIGN KEY ("feature") REFERENCES "public"."OrganizationFeatureOption"("value")
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE TRIGGER "set_public_OrganizationFeature_updated_at"
BEFORE UPDATE ON "public"."OrganizationFeature"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
