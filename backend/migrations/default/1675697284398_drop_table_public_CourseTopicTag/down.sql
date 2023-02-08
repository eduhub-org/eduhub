CREATE TABLE "public"."CourseTopicTag" ("id" serial NOT NULL, "courseId" integer NOT NULL, "topicTagId" integer NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON UPDATE restrict ON DELETE restrict, FOREIGN KEY ("topicTagId") REFERENCES "public"."TopicTag"("id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("id"));COMMENT ON TABLE "public"."CourseTopicTag" IS E'A new row is added when a course or other element is tagged with a topic.';
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
CREATE TRIGGER "set_public_CourseTopicTag_updated_at"
BEFORE UPDATE ON "public"."CourseTopicTag"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_CourseTopicTag_updated_at" ON "public"."CourseTopicTag" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
