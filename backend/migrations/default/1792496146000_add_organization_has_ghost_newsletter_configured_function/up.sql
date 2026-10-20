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
  -- '\S' (any non-whitespace character) rather than btrim, which only strips spaces, so tabs
  -- and newlines count as empty like JavaScript's trim() in the sync function.
  SELECT
    coalesce(organization_row."ghostNewsletterApiUrl", '') ~ '\S'
    AND coalesce(organization_row."ghostNewsletterApiKeyEncrypted", '') ~ '\S'
    AND (
      coalesce(organization_row."ghostNewsletterListId", '') ~ '\S'
      OR coalesce(organization_row."ghostNewsletterSlug", '') ~ '\S'
    );
$function$;
