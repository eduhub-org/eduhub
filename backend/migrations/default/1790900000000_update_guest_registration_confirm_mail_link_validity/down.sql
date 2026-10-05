UPDATE "public"."MailTemplate"
SET
  "content" = replace(
    replace(
      "content",
      'Der Link ist 24 Stunden gültig, höchstens bis zum Beginn der Veranstaltung.',
      'Der Link ist 7 Tage gültig.'
    ),
    'The link is valid for 24 hours, but no longer than until the event starts.',
    'The link is valid for 7 days.'
  ),
  "updated_at" = NOW()
WHERE "type" = 'GUEST_REGISTRATION_CONFIRM';
