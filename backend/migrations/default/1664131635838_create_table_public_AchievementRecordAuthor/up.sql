CREATE TABLE "public"."AchievementRecordAuthor" ("id" serial NOT NULL, "achievementRecordId" integer NOT NULL, "userId" UUID NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("achievementRecordId") REFERENCES "public"."AchievementRecord"("id") ON UPDATE restrict ON DELETE cascade, FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("id"));COMMENT ON TABLE "public"."AchievementRecordAuthor" IS E'A new row is added for each user selected as author in the modal to upload an achievement record.';
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
CREATE TRIGGER "set_public_AchievementRecordAuthor_updated_at"
BEFORE UPDATE ON "public"."AchievementRecordAuthor"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_AchievementRecordAuthor_updated_at" ON "public"."AchievementRecordAuthor" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
