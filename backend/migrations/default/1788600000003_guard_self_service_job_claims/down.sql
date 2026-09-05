DROP INDEX IF EXISTS "public"."MailLog_job_organization_access_request_unique";

DROP TRIGGER IF EXISTS "organization_admin_single_job_claim" ON "public"."OrganizationAdmin";
DROP FUNCTION IF EXISTS "public"."organization_admin_single_job_claim"();
