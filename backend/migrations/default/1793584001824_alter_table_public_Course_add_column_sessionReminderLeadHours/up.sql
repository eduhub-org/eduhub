-- Session reminders become one email per participant, a course-chosen number
-- of hours before the course's first session (previously: three fixed sends at
-- 24h, 1h and 15min, which never went out because no cron called them).

-- Null means the course sends no session reminder. Existing courses get the
-- 24h default too, so reminders start for every course whose first session is
-- still ahead.
ALTER TABLE "public"."Course"
  ADD COLUMN "sessionReminderLeadHours" integer NULL DEFAULT 24
  CONSTRAINT "Course_sessionReminderLeadHours_positive" CHECK ("sessionReminderLeadHours" > 0);

COMMENT ON COLUMN "public"."Course"."sessionReminderLeadHours" IS
  E'How many hours before the first session participants get the session reminder email. Null sends none.';

UPDATE "public"."MailTemplateType"
SET "comment" = 'Sent once to participants a set number of hours before the first session'
WHERE "value" = 'SESSION_REMINDER';

-- New default text. It has never been sent, so replacing it loses nothing;
-- course-specific copies are left as they are.
UPDATE "public"."MailTemplate"
SET
  "subject" = 'Erinnerung / Reminder: [Enrollment:CourseId--Course:Name] – [Session:StartDateTime], [Session:Location]',
  "content" = $tpl$<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName],</p>
  <p>bald geht's los! Hier noch einmal alle Infos zu <strong>[Enrollment:CourseId--Course:Name]</strong>:</p>
  <p>
    <strong>Wann:</strong> [Session:DateTimeRange] Uhr<br>
    <strong>Wo:</strong> [Session:Location]<br>
    <strong>Details:</strong> <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a>
  </p>
  <p>Du kannst doch nicht teilnehmen? Dann sag uns bitte über den Link oben Bescheid, damit wir besser planen können.</p>
  <p>Viele Grüße<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hi [User:FirstName],</p>
  <p>it's almost time! Here are all the details for <strong>[Enrollment:CourseId--Course:Name]</strong> once more:</p>
  <p>
    <strong>When:</strong> [Session:DateTimeRange]<br>
    <strong>Where:</strong> [Session:Location]<br>
    <strong>Details:</strong> <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a>
  </p>
  <p>Can't make it after all? Please let us know via the link above so we can plan accordingly.</p>
  <p>Best regards<br>The EduHub Team</p>
</body>
</html>$tpl$,
  "updated_at" = NOW()
WHERE "type" = 'SESSION_REMINDER' AND "courseId" IS NULL;
