-- Restore buyerOrganizationId column
ALTER TABLE "public"."Invoice"
ADD COLUMN "buyerOrganizationId" integer NULL;

ALTER TABLE "public"."Invoice"
ADD CONSTRAINT "Invoice_buyerOrganizationId_fkey"
FOREIGN KEY ("buyerOrganizationId")
REFERENCES "public"."Organization" ("id")
ON UPDATE RESTRICT ON DELETE RESTRICT;

COMMENT ON COLUMN "public"."Invoice"."buyerOrganizationId" IS 'B2B buyer organization. NULL means B2C individual purchase';
