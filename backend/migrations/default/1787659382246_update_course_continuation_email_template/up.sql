-- The COURSE_CONTINUATION_INQUIRY mail is now sent as soon as a participant
-- *reaches* the course's max missed sessions (instead of only once the limit
-- is exceeded), so the wording becomes a friendly heads-up: attend the
-- remaining sessions, or drop us a short note if you no longer want to
-- take part. Only the default template (courseId IS NULL) is touched;
-- course-specific templates stay as their teams wrote them.

UPDATE "public"."MailTemplateType"
SET "comment" = 'Sent when a user reaches the course''s max missed sessions, asking them to attend the remaining sessions or to let us know if they want to stop'
WHERE "value" = 'COURSE_CONTINUATION_INQUIRY';

UPDATE "public"."MailTemplate"
SET "subject" = 'Bitte keine weiteren Termine verpassen / Please don''t miss further sessions - [Enrollment:CourseId--Course:Name]',
    "content" = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>uns ist aufgefallen, dass du bei <strong>[Enrollment:CourseId--Course:Name]</strong> inzwischen so viele Termine verpasst hast, wie für einen erfolgreichen Abschluss maximal möglich ist.</p>
  <p>Wir würden dich gerne weiter dabei haben: Bitte achte darauf, keine weiteren Termine zu verpassen, damit du den Kurs erfolgreich abschließen kannst.</p>
  <p>Falls du nicht mehr teilnehmen möchtest, gib uns einfach kurz Bescheid oder wende dich an das Kursteam – dann können wir den Platz weitergeben. Den Kurs findest du hier: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>We noticed that you have now missed as many sessions of <strong>[Enrollment:CourseId--Course:Name]</strong> as are allowed for a successful completion.</p>
  <p>We would love to keep you on board: please make sure not to miss any further sessions so that you can still complete the course successfully.</p>
  <p>If you no longer want to take part, just send us a short note or contact the course team – that way we can offer your spot to someone else. You can find the course here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
  </body></html>',
    "updated_at" = NOW()
WHERE "type" = 'COURSE_CONTINUATION_INQUIRY' AND "courseId" IS NULL;
