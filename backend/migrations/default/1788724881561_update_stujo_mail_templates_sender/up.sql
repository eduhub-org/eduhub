-- StuJo mails go out as team@stujo.net rather than noreply@stujo.net.
--
-- Two reasons the address is a real mailbox rather than a noreply one: the job
-- board asks people to answer (the organization access request template says
-- "antworte einfach auf diese E-Mail"), and stujo.net is the neutral name the
-- white-label portals share, so it carries none of the opencampus.sh branding
-- a partner portal should not be sending under.
--
-- Only the StuJo templates move; the opencampus.sh ones keep their sender.
-- functions/sendMail picks the Mailgun sending domain from this address, so
-- until stujo.net is a verified Mailgun domain these mails still leave under
-- the default domain with its own noreply sender -- correct in either order.
UPDATE "public"."MailTemplate"
  SET "from" = 'team@stujo.net', "updated_at" = NOW()
  WHERE "from" = 'noreply@stujo.net';
