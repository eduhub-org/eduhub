-- Create FAQs table
CREATE TABLE "public"."Faq" (
  "id" serial NOT NULL,
  "collectionId" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Add comment to the table
COMMENT ON TABLE "public"."Faq" IS E'FAQ entries that can have translations in multiple languages';

-- Add foreign key constraint to FaqCollection
ALTER TABLE "public"."Faq" 
ADD CONSTRAINT "Faq_collectionId_fkey" 
FOREIGN KEY ("collectionId") REFERENCES "public"."FaqCollection"("id") 
ON UPDATE RESTRICT ON DELETE CASCADE;