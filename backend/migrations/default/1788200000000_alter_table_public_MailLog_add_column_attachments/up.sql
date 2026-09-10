ALTER TABLE "public"."MailLog" ADD COLUMN "attachments" jsonb NULL;

COMMENT ON COLUMN "public"."MailLog"."attachments" IS E'Array of file descriptors the send-mail function fetches over HTTPS and attaches, e.g. [{"url": "https://invoice.stripe.com/.../pdf", "filename": "rechnung-A1B2-0001.pdf", "contentType": "application/pdf"}]. Never stores file bytes. Only admin-secret code writes MailLog, and send-mail additionally restricts fetches to an allowlist of hosts. A fetch failure degrades to sending the mail without the attachment.';
