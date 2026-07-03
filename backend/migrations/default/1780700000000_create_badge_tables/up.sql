-- Reusable badge definitions and project links. Badge carries the title /
-- description / icon shown for every entity linked to it, so badge context is
-- authored once and displayed automatically. ProjectBadge links a project to a
-- badge with a per-project status (won vs nominated). Kept separate from
-- ProjectGroup so badges never leak into topical grouping or project sliders.

CREATE TABLE "public"."BadgeStatus" (
  "value" text NOT NULL,
  "comment" text,
  PRIMARY KEY ("value")
);
COMMENT ON TABLE "public"."BadgeStatus" IS E'Whether a badge was won or only nominated.';
INSERT INTO "public"."BadgeStatus"("value", "comment") VALUES (E'NOMINATED', E'Nominated / shortlisted for the badge.');
INSERT INTO "public"."BadgeStatus"("value", "comment") VALUES (E'WON', E'Badge was won / earned.');

CREATE TABLE "public"."Badge" (
  "id" serial NOT NULL,
  "title" text NOT NULL,
  "description" text NULL,
  "icon" text NULL,
  "order" integer NOT NULL DEFAULT 0,
  "organizationId" integer NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("id"),
  CONSTRAINT "Badge_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
COMMENT ON TABLE "public"."Badge" IS E'Reusable badge definition (e.g. "AI Idea Award 2024"). title and description are shown automatically for every entity linked via a per-target link table. icon is an optional lucide icon name.';
CREATE INDEX "Badge_organizationId_idx" ON "public"."Badge" ("organizationId");

CREATE TABLE "public"."ProjectBadge" (
  "id" serial NOT NULL,
  "projectId" integer NOT NULL,
  "badgeId" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'NOMINATED',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("id"),
  UNIQUE ("projectId", "badgeId"),
  CONSTRAINT "ProjectBadge_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "ProjectBadge_badgeId_fkey"
    FOREIGN KEY ("badgeId") REFERENCES "public"."Badge"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "ProjectBadge_status_fkey"
    FOREIGN KEY ("status") REFERENCES "public"."BadgeStatus"("value") ON UPDATE CASCADE ON DELETE RESTRICT
);
COMMENT ON TABLE "public"."ProjectBadge" IS E'Links a project to a badge with a per-project status (WON / NOMINATED).';
CREATE INDEX "ProjectBadge_projectId_idx" ON "public"."ProjectBadge" ("projectId");
CREATE INDEX "ProjectBadge_badgeId_idx" ON "public"."ProjectBadge" ("badgeId");
CREATE INDEX "ProjectBadge_status_idx" ON "public"."ProjectBadge" ("status");

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "set_public_Badge_updated_at"
BEFORE UPDATE ON "public"."Badge"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Badge_updated_at" ON "public"."Badge"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

CREATE TRIGGER "set_public_ProjectBadge_updated_at"
BEFORE UPDATE ON "public"."ProjectBadge"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_ProjectBadge_updated_at" ON "public"."ProjectBadge"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
