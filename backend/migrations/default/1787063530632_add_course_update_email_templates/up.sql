-- Course-side change email templates: session rescheduled, payment receipt,
-- and course-continuation inquiry (max missed sessions exceeded).
-- All default templates (courseId = NULL) and bilingual (German + English).

INSERT INTO "public"."MailTemplateType" ("value", "comment")
VALUES
  ('SESSION_RESCHEDULED', 'Sent to active enrollees when a session start/end time changes'),
  ('PAYMENT_RECEIPT', 'Sent to the payer when a course/event enrollment invoice is paid'),
  ('COURSE_CONTINUATION_INQUIRY', 'Sent when a user exceeds the course''s max missed sessions, asking whether they intend to continue')
ON CONFLICT ("value") DO NOTHING;

-- SESSION_RESCHEDULED
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT 'SESSION_RESCHEDULED', NULL,
  'Terminänderung / Session rescheduled - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>der Termin für eine Session von <strong>[Enrollment:CourseId--Course:Name]</strong> hat sich geändert.</p>
  <p><strong>[Session:Title]</strong> findet nun statt am: [Session:StartDateTime] – [Session:EndDateTime]</p>
  <p>Alle Details findest du hier: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>The time of a session for <strong>[Enrollment:CourseId--Course:Name]</strong> has changed.</p>
  <p><strong>[Session:Title]</strong> now takes place on: [Session:StartDateTime] – [Session:EndDateTime]</p>
  <p>You can find all details here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
  </body></html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'SESSION_RESCHEDULED' AND "courseId" IS NULL);

-- PAYMENT_RECEIPT
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT 'PAYMENT_RECEIPT', NULL,
  'Zahlungsbestätigung / Payment confirmation - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>vielen Dank! Wir haben deine Zahlung für <strong>[Enrollment:CourseId--Course:Name]</strong> erhalten.</p>
  <p>Gesamtbetrag: [Enrollment:TotalCost] €</p>
  <p>Deine Buchung findest du hier: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Thank you! We have received your payment for <strong>[Enrollment:CourseId--Course:Name]</strong>.</p>
  <p>Total amount: [Enrollment:TotalCost] €</p>
  <p>You can find your booking here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
  </body></html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'PAYMENT_RECEIPT' AND "courseId" IS NULL);

-- COURSE_CONTINUATION_INQUIRY
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT 'COURSE_CONTINUATION_INQUIRY', NULL,
  'Möchtest du weitermachen? / Do you want to continue? - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
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
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'COURSE_CONTINUATION_INQUIRY' AND "courseId" IS NULL);
