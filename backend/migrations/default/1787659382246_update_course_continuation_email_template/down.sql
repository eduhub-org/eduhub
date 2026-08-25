-- Restores the previous "you missed more sessions than allowed" wording.

UPDATE "public"."MailTemplateType"
SET "comment" = 'Sent when a user exceeds the course''s max missed sessions, asking whether they intend to continue'
WHERE "value" = 'COURSE_CONTINUATION_INQUIRY';

UPDATE "public"."MailTemplate"
SET "subject" = 'Möchtest du weitermachen? / Do you want to continue? - [Enrollment:CourseId--Course:Name]',
    "content" = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>uns ist aufgefallen, dass du mehr Termine von <strong>[Enrollment:CourseId--Course:Name]</strong> verpasst hast, als für einen erfolgreichen Abschluss vorgesehen sind.</p>
  <p>Möchtest du den Kurs weiterhin besuchen? Bitte gib uns kurz Bescheid bzw. wende dich an das Kursteam. Den Kurs findest du hier: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>We noticed that you have missed more sessions of <strong>[Enrollment:CourseId--Course:Name]</strong> than allowed for a successful completion.</p>
  <p>Do you still intend to continue the course? Please let us know or contact the course team. You can find the course here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
  </body></html>',
    "updated_at" = NOW()
WHERE "type" = 'COURSE_CONTINUATION_INQUIRY' AND "courseId" IS NULL;
