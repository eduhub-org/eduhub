-- Named groups projects can be tagged into (mirrors CourseGroupOption, minus
-- programType/sliderGroup). A home project slider can select one or more of
-- these groups to compose its membership.
CREATE TABLE "public"."ProjectGroupOption" (
  "id" serial NOT NULL,
  "title" text NOT NULL,
  "order" integer NOT NULL,
  "organizationId" integer NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("id"),
  UNIQUE ("title"),
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
COMMENT ON TABLE "public"."ProjectGroupOption" IS E'Defines the possible groups a project can be assigned to, used to compose project sliders. The provided order is used to show the groups in the respective order.';

CREATE INDEX "ProjectGroupOption_organizationId_idx" ON "public"."ProjectGroupOption" ("organizationId");

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
CREATE TRIGGER "set_public_ProjectGroupOption_updated_at"
BEFORE UPDATE ON "public"."ProjectGroupOption"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_ProjectGroupOption_updated_at" ON "public"."ProjectGroupOption"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
