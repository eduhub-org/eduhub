-- Organizations whose published programs, besides those of the default organization (id 0), fill
-- the automatic homepage sliders (Courses, Events, Degrees) and the public events RSS/iCal feeds.
-- The default organization is always included and therefore never stored here.
CREATE TABLE "public"."HomeSliderOrganization" (
  "id" serial NOT NULL,
  "organizationId" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("organizationId"),
  CONSTRAINT "HomeSliderOrganization_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "HomeSliderOrganization_not_default_organization" CHECK ("organizationId" <> 0)
);
COMMENT ON TABLE "public"."HomeSliderOrganization" IS E'Organizations whose programs appear in the automatic homepage sliders and the public event feeds, in addition to the always included default organization (id 0).';

CREATE TRIGGER "set_public_HomeSliderOrganization_updated_at"
BEFORE UPDATE ON "public"."HomeSliderOrganization"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
