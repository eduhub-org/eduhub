-- The guest confirmation link now lasts 24 hours, but never past the start of
-- the event's next session (confirmTokenExpiresAt in guestRegistration.js).
-- Only the two validity sentences are swapped, so other edits made to the
-- template - including course-specific copies - are kept.
UPDATE "public"."MailTemplate"
SET
  "content" = replace(
    replace(
      "content",
      'Der Link ist 7 Tage gültig.',
      'Der Link ist 24 Stunden gültig, höchstens bis zum Beginn der Veranstaltung.'
    ),
    'The link is valid for 7 days.',
    'The link is valid for 24 hours, but no longer than until the event starts.'
  ),
  "updated_at" = NOW()
WHERE "type" = 'GUEST_REGISTRATION_CONFIRM'
  AND ("content" LIKE '%Der Link ist 7 Tage gültig.%' OR "content" LIKE '%The link is valid for 7 days.%');
