-- Create FAQ translations table
CREATE TABLE "public"."FaqTranslation" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "faqId" uuid NOT NULL,
  "lang" text NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("faqId", "lang")
);

-- Add comment to the table
COMMENT ON TABLE "public"."FaqTranslation" IS E'Translations for FAQ entries in different languages';

-- Add foreign key constraint to Faq
ALTER TABLE "public"."FaqTranslation" 
ADD CONSTRAINT "FaqTranslation_faqId_fkey" 
FOREIGN KEY ("faqId") REFERENCES "public"."Faq"("id") 
ON UPDATE RESTRICT ON DELETE CASCADE;

-- Add foreign key constraint to Language table
ALTER TABLE "public"."FaqTranslation" 
ADD CONSTRAINT "FaqTranslation_lang_fkey" 
FOREIGN KEY ("lang") REFERENCES "public"."Language"("value") 
ON UPDATE RESTRICT ON DELETE RESTRICT;