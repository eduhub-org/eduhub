CREATE TABLE "public"."AchievementOptionMentor" ("id" serial NOT NULL, "achievementOptionId" integer NOT NULL, "expertId" integer NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("achievementOptionId") REFERENCES "public"."AchievementOption"("id") ON UPDATE restrict ON DELETE restrict, FOREIGN KEY ("expertId") REFERENCES "public"."Expert"("id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("id"));COMMENT ON TABLE "public"."AchievementOptionMentor" IS E'A new row is added for each expert added as mentor to an achievement option.';
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
CREATE TRIGGER "set_public_AchievementOptionMentor_updated_at"
BEFORE UPDATE ON "public"."AchievementOptionMentor"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_AchievementOptionMentor_updated_at" ON "public"."AchievementOptionMentor" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
