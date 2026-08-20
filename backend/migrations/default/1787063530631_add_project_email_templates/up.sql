-- Project lifecycle email templates. All default templates (courseId = NULL) and
-- bilingual (German + English) in a single body, following the ORGANIZER_ADDED model.

INSERT INTO "public"."MailTemplateType" ("value", "comment")
VALUES
  ('PROJECT_JOIN_REQUESTED', 'Sent to project owner/staff when a user requests to join a project'),
  ('PROJECT_JOIN_ACCEPTED', 'Sent to a user whose request to join a project was accepted'),
  ('PROJECT_JOIN_DECLINED', 'Sent to a user whose request to join a project was declined'),
  ('PROJECT_AUTHOR_EXCLUDED', 'Sent to a project author who was removed from the final submission'),
  ('PROJECT_TEAM_CONFIRMED', 'Sent to project authors when the team is confirmed and the project starts (ONGOING)'),
  ('PROJECT_SENT_BACK', 'Sent to project authors when a submitted project is sent back for revision'),
  ('PROJECT_SUBMITTED', 'Sent to instructors/mentors and authors when a project is submitted for review'),
  ('PROJECT_APPROVED', 'Sent to project authors when a project is approved/completed'),
  ('PROJECT_REJECTED', 'Sent to project authors when a project is rated as not passed'),
  ('PROJECT_DEADLINE_REMINDER', 'Reminder sent to project authors before the submission deadline')
ON CONFLICT ("value") DO NOTHING;

-- Helper pattern: one guarded INSERT per default template.

-- PROJECT_JOIN_REQUESTED
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT 'PROJECT_JOIN_REQUESTED', NULL,
  'Neue Beitrittsanfrage / New join request - [Project:Title]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>[Project:ApplicantName] möchte dem Projekt <strong>[Project:Title]</strong> beitreten.</p>
  <p>Du kannst die Anfrage hier prüfen: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>[Project:ApplicantName] has requested to join the project <strong>[Project:Title]</strong>.</p>
  <p>You can review the request here: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
  </body></html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'PROJECT_JOIN_REQUESTED' AND "courseId" IS NULL);

-- PROJECT_JOIN_ACCEPTED
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT 'PROJECT_JOIN_ACCEPTED', NULL,
  'Du bist dabei / You are in - [Project:Title]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>deine Anfrage, dem Projekt <strong>[Project:Title]</strong> beizutreten, wurde angenommen.</p>
  <p>Hier geht es zum Projekt: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Your request to join the project <strong>[Project:Title]</strong> has been accepted.</p>
  <p>Go to the project here: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
  </body></html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'PROJECT_JOIN_ACCEPTED' AND "courseId" IS NULL);

-- PROJECT_JOIN_DECLINED
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT 'PROJECT_JOIN_DECLINED', NULL,
  'Zu deiner Beitrittsanfrage / Regarding your join request - [Project:Title]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>deine Anfrage, dem Projekt <strong>[Project:Title]</strong> beizutreten, wurde leider nicht angenommen.</p>
  <p>Du kannst dir andere Projekte hier ansehen: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Unfortunately, your request to join the project <strong>[Project:Title]</strong> was not accepted.</p>
  <p>You can browse other projects here: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
  </body></html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'PROJECT_JOIN_DECLINED' AND "courseId" IS NULL);

-- PROJECT_AUTHOR_EXCLUDED
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT 'PROJECT_AUTHOR_EXCLUDED', NULL,
  'Änderung deiner Projektteilnahme / Change to your project participation - [Project:Title]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>du wurdest aus der finalen Einreichung des Projekts <strong>[Project:Title]</strong> entfernt.</p>
  <p>Bei Fragen wende dich bitte an dein Kurs- bzw. Projektteam: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>You have been removed from the final submission of the project <strong>[Project:Title]</strong>.</p>
  <p>If you have any questions, please contact your course or project team: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
  </body></html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'PROJECT_AUTHOR_EXCLUDED' AND "courseId" IS NULL);

-- PROJECT_TEAM_CONFIRMED
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT 'PROJECT_TEAM_CONFIRMED', NULL,
  'Euer Projekt startet / Your project is starting - [Project:Title]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>euer Team für <strong>[Project:Title]</strong> wurde bestätigt und das Projekt ist jetzt aktiv.</p>
  <p>Hier geht es zum Projekt: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Viel Erfolg!<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Your team for <strong>[Project:Title]</strong> has been confirmed and the project is now active.</p>
  <p>Go to the project here: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Good luck!<br>The EduHub Team</p>
  </body></html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'PROJECT_TEAM_CONFIRMED' AND "courseId" IS NULL);

-- PROJECT_SENT_BACK
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT 'PROJECT_SENT_BACK', NULL,
  'Überarbeitung erforderlich / Revision required - [Project:Title]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>euer Projekt <strong>[Project:Title]</strong> wurde zur Überarbeitung zurückgegeben.</p>
  [Project:ReviewComment]
  <p>Bitte seht euch die Rückmeldungen an und reicht das Projekt erneut ein: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Your project <strong>[Project:Title]</strong> has been sent back for revision.</p>
  [Project:ReviewComment]
  <p>Please review the feedback and submit again: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
  </body></html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'PROJECT_SENT_BACK' AND "courseId" IS NULL);

-- PROJECT_SUBMITTED
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT 'PROJECT_SUBMITTED', NULL,
  'Projekt eingereicht / Project submitted - [Project:Title]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>das Projekt <strong>[Project:Title]</strong> wurde zur Bewertung eingereicht.</p>
  <p>Details findest du hier: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>The project <strong>[Project:Title]</strong> has been submitted for review.</p>
  <p>You can find the details here: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
  </body></html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'PROJECT_SUBMITTED' AND "courseId" IS NULL);

-- PROJECT_APPROVED
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT 'PROJECT_APPROVED', NULL,
  'Projekt bestanden / Project approved - [Project:Title]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>Glückwunsch! Euer Projekt <strong>[Project:Title]</strong> wurde erfolgreich abgeschlossen.</p>
  [Project:ReviewComment]
  <p>Hier geht es zum Projekt: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Congratulations! Your project <strong>[Project:Title]</strong> has been successfully completed.</p>
  [Project:ReviewComment]
  <p>Go to the project here: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
  </body></html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'PROJECT_APPROVED' AND "courseId" IS NULL);

-- PROJECT_REJECTED
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT 'PROJECT_REJECTED', NULL,
  'Zu eurem Projekt / Regarding your project - [Project:Title]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>euer Projekt <strong>[Project:Title]</strong> wurde als nicht bestanden bewertet.</p>
  [Project:ReviewComment]
  <p>Bei Fragen wende dich bitte an dein Projektteam: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Your project <strong>[Project:Title]</strong> has been rated as not passed.</p>
  [Project:ReviewComment]
  <p>If you have any questions, please contact your project team: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
  </body></html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'PROJECT_REJECTED' AND "courseId" IS NULL);

-- PROJECT_DEADLINE_REMINDER
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT 'PROJECT_DEADLINE_REMINDER', NULL,
  'Einreichungsfrist rückt näher / Submission deadline approaching - [Project:Title]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>die Einreichungsfrist für euer Projekt <strong>[Project:Title]</strong> rückt näher.</p>
  <p>Bitte reicht euer Projekt rechtzeitig ein: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>The submission deadline for your project <strong>[Project:Title]</strong> is approaching.</p>
  <p>Please submit your project in time: <a href="[Project:Link]">[Project:Link]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
  </body></html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'PROJECT_DEADLINE_REMINDER' AND "courseId" IS NULL);
