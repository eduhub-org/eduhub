-- The "request approval" button on a project proposal promised to inform the
-- course instructors, but no email was sent: instructors only saw the request
-- in course management, and teams waited without anyone noticing.
--
-- PROJECT_REVIEW_REQUESTED goes to the course instructors and the project's
-- mentors when a team requests approval. The default template blind-copies
-- the EduHub team so it sees every proposal in every course; the address can
-- be changed or removed in Settings -> Email templates.

INSERT INTO "public"."MailTemplateType" ("value", "comment")
VALUES ('PROJECT_REVIEW_REQUESTED', 'Sent to course instructors and project mentors when a team requests approval of its project proposal')
ON CONFLICT ("value") DO NOTHING;

INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "bcc", "created_at", "updated_at")
SELECT 'PROJECT_REVIEW_REQUESTED', NULL,
  'Projektfreigabe angefragt / Project approval requested - [Project:Title]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>das Team des Projekts <strong>[Project:Title]</strong> im Kurs <strong>[Project:CourseTitle]</strong> bittet um die Freigabe seines Projektvorschlags.</p>
  <p>Bitte prüfe Team und Projektdetails und bestätige das Projekt oder gib dem Team eine Rückmeldung: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>The team of the project <strong>[Project:Title]</strong> in the course <strong>[Project:CourseTitle]</strong> is asking for approval of its project proposal.</p>
  <p>Please review the team and project details and confirm the project or give the team feedback: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
  </body></html>',
  'noreply@opencampus.sh', 'edu@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'PROJECT_REVIEW_REQUESTED' AND "courseId" IS NULL);
