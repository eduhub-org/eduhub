ALTER TABLE "public"."AppSettings" ADD COLUMN "heroHeadlineDe" text NULL;
ALTER TABLE "public"."AppSettings" ADD COLUMN "heroHeadlineEn" text NULL;

COMMENT ON COLUMN "public"."AppSettings"."heroHeadlineDe" IS E'German homepage hero headline as Markdown: **bold** marks the emphasised words, each line break starts a new line. NULL falls back to the built-in translation.';
COMMENT ON COLUMN "public"."AppSettings"."heroHeadlineEn" IS E'English homepage hero headline as Markdown: **bold** marks the emphasised words, each line break starts a new line. NULL falls back to the built-in translation.';
