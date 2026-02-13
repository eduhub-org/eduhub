-- Add billing organization reference for B2B purchases
-- If set: B2B purchase, invoice buyer is this organization. If NULL: B2C, invoice buyer is the enrolling user personally.
ALTER TABLE "public"."CourseEnrollment"
ADD COLUMN "billingOrganizationId" integer NULL;

COMMENT ON COLUMN "public"."CourseEnrollment"."billingOrganizationId" IS 'Organization paying for this enrollment (B2B). NULL means the enrolling user pays personally (B2C)';

-- Add foreign key constraint
ALTER TABLE "public"."CourseEnrollment"
ADD CONSTRAINT "CourseEnrollment_billingOrganizationId_fkey"
FOREIGN KEY ("billingOrganizationId")
REFERENCES "public"."Organization" ("id")
ON UPDATE RESTRICT ON DELETE RESTRICT;

-- Add index for lookups by billing organization
CREATE INDEX "CourseEnrollment_billingOrganizationId_idx" ON "public"."CourseEnrollment" ("billingOrganizationId");
