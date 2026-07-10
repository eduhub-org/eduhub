-- Job alert subscriptions ("Job-Letter"): the Rails app had the settings
-- UI but never sent mails; per business decision (2026-07-11) the feature
-- is now launched properly with a weekly cron (send_job_alerts).
CREATE TABLE "public"."JobAlertSubscription" (
  "id"             serial      NOT NULL,
  "userId"         uuid        NOT NULL,
  "active"         boolean     NOT NULL DEFAULT true,
  "jobPostingType" text        NULL,
  "region"         text        NULL,
  "lastSentAt"     timestamptz NULL,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "updated_at"     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("userId")
);

COMMENT ON TABLE "public"."JobAlertSubscription" IS E'Weekly job alert (Job-Letter) subscription per user; optional type/region filters.';

ALTER TABLE "public"."JobAlertSubscription"
  ADD CONSTRAINT "JobAlertSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
  ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE "public"."JobAlertSubscription"
  ADD CONSTRAINT "JobAlertSubscription_jobPostingType_fkey"
  FOREIGN KEY ("jobPostingType") REFERENCES "public"."JobPostingType"("value")
  ON UPDATE RESTRICT ON DELETE SET NULL;

ALTER TABLE "public"."JobAlertSubscription"
  ADD CONSTRAINT "JobAlertSubscription_region_fkey"
  FOREIGN KEY ("region") REFERENCES "public"."JobRegion"("value")
  ON UPDATE RESTRICT ON DELETE SET NULL;

CREATE TRIGGER "set_public_JobAlertSubscription_updated_at"
BEFORE UPDATE ON "public"."JobAlertSubscription"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

-- Mail template for the weekly alert
INSERT INTO "public"."MailTemplateType" ("value", "comment") VALUES
  ('JOB_ALERT', 'Weekly job alert (Job-Letter) with new postings');

INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from") VALUES
  (
    'JOB_ALERT', NULL,
    'Neue Stellenangebote auf StuJo',
    '<p>Hallo,</p><p>diese Angebote sind neu auf StuJo:</p>[JobAlert:List]<p><a href="[JobAlert:AllJobsUrl]">Alle Stellenangebote ansehen</a></p><p>Du erhältst diesen Job-Letter, weil Du ihn abonniert hast. <a href="[JobAlert:UnsubscribeUrl]">Abbestellen</a>.</p>',
    'noreply@stujo.net'
  );
