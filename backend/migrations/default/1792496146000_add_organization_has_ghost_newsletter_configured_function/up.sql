-- Whether an organization's Ghost newsletter is ready to sync subscriptions. Mirrors
-- hasGhostConfiguration in functions/callNodeFunction/syncGhostNewsletterSubscription.
-- Exposed publicly as the Organization.hasGhostNewsletterConfigured computed field so
-- participants can see which newsletters they can subscribe to without being able to read
-- the settings-admin-only credential columns.
CREATE FUNCTION "public"."organization_has_ghost_newsletter_configured"(organization_row "public"."Organization")
RETURNS boolean
LANGUAGE sql
STABLE
AS $function$
  SELECT
    btrim(coalesce(organization_row."ghostNewsletterApiUrl", '')) <> ''
    AND btrim(coalesce(organization_row."ghostNewsletterApiKeyEncrypted", '')) <> ''
    AND (
      btrim(coalesce(organization_row."ghostNewsletterListId", '')) <> ''
      OR btrim(coalesce(organization_row."ghostNewsletterSlug", '')) <> ''
    );
$function$;
