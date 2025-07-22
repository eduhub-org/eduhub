-- Remove email templates for registration process
DELETE FROM "public"."MailTemplate" 
WHERE "title" IN (
  'APPLICATION_RECEIVED',
  'APPLICATION_CONFIRMED', 
  'SESSION_REMINDER',
  'INVITE',
  'DECLINE',
  'REGISTRATION_CONFIRMED'
); 