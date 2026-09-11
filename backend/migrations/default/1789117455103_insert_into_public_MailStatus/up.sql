-- MailStatus is the lookup table for MailLog.status, but it only ever held the
-- three values from 2021 (UNSENT, SENT, SENDING_ERROR). Meanwhile every queueing
-- path in the codebase writes READY_TO_SEND -- mail_helpers.queue_mail,
-- queueEmail.js, guestRegistration, publishJobPosting, sendEnrollmentEmail,
-- sendSessionReminders, stripeJobPosting and the cutover scripts -- so the table
-- has been contradicting the data for years. MailLog.status is plain text with
-- no foreign key, which is the only reason that never failed.
--
-- The three delivery outcomes are new: sync_mail_delivery_status reads them back
-- from the Mailgun events API and writes them onto the row that was sent.
INSERT INTO "public"."MailStatus" ("value", "comment") VALUES
  (E'READY_TO_SEND', E'The mail is queued and the send_mail event trigger will deliver it'),
  (E'DELIVERED',     E'Mailgun confirmed the receiving server accepted the mail'),
  (E'BOUNCED',       E'Mailgun gave up permanently - the address is invalid or refuses mail'),
  (E'COMPLAINED',    E'The recipient marked the mail as spam - do not mail this address again')
ON CONFLICT ("value") DO NOTHING;
