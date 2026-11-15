-- The confirmation mails name when and where a Course takes place, from its
-- Sessions ([Course:DateTime], [Course:LocationList]), and drop the end date
-- and the registration date. Only the global defaults (courseId IS NULL) are
-- rewritten; course-specific templates stay as their organizers wrote them.

UPDATE "public"."MailTemplate"
SET "content" = '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- Deutsch -->
  <p>Moin [User:FirstName],</p>
  <p>vielen Dank für Deine Anmeldung zu <strong>[Enrollment:CourseId--Course:Name]</strong>! Deine Teilnahme ist bestätigt.</p>
  [#if:CourseDateTime]<p><strong>Wann:</strong> [Course:DateTime]</p>[/if:CourseDateTime]
  [#if:CourseLocation]<p style="margin-bottom:0;"><strong>Wo:</strong></p>[Course:LocationList][/if:CourseLocation]
  [#if:Calendar]<p>Im Anhang findest Du eine Kalenderdatei, mit der Du die Termine in Deinen Kalender übernehmen kannst.</p>[/if:Calendar]
  [#if:Online]<p>Den Zugangslink für online bekommst Du mit der Erinnerungsmail vor dem Start; er steht auch auf der Seite unten.</p>[/if:Online]
  <p>Alle Infos und mögliche Änderungen findest Du hier: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Falls Du doch nicht teilnehmen kannst, melde Dich bitte dort ab, damit jemand anderes Deinen Platz bekommt.</p>
  <p>Viele Grüße<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName],</p>
  <p>Thank you for registering for <strong>[Enrollment:CourseId--Course:Name]</strong>! Your place is confirmed.</p>
  [#if:CourseDateTime]<p><strong>When:</strong> [Course:DateTime]</p>[/if:CourseDateTime]
  [#if:CourseLocation]<p style="margin-bottom:0;"><strong>Where:</strong></p>[Course:LocationList][/if:CourseLocation]
  [#if:Calendar]<p>The attached calendar file lets you add the dates to your calendar.</p>[/if:Calendar]
  [#if:Online]<p>You will get the access link for online participation with the reminder email before the start; it is also on the page linked below.</p>[/if:Online]
  <p>All details and any changes are here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>If you can no longer attend, please cancel your registration there so someone else can have your place.</p>
  <p>Best regards<br>The EduHub Team</p>
</body>
</html>',
    "updated_at" = NOW()
WHERE "type" = 'REGISTRATION_CONFIRMED' AND "courseId" IS NULL;

UPDATE "public"."MailTemplate"
SET "content" = '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- Deutsch -->
  <p>Moin [User:FirstName],</p>
  <p>Deine Teilnahme an <strong>[Enrollment:CourseId--Course:Name]</strong> ist bestätigt. Schön, dass Du dabei bist!</p>
  [#if:CourseDateTime]<p><strong>Wann:</strong> [Course:DateTime]</p>[/if:CourseDateTime]
  [#if:CourseLocation]<p style="margin-bottom:0;"><strong>Wo:</strong></p>[Course:LocationList][/if:CourseLocation]
  [#if:Calendar]<p>Im Anhang findest Du eine Kalenderdatei, mit der Du die Termine in Deinen Kalender übernehmen kannst.</p>[/if:Calendar]
  [#if:Online]<p>Den Zugangslink für online bekommst Du mit der Erinnerungsmail vor dem Start; er steht auch auf der Seite unten.</p>[/if:Online]
  <p>Alle Infos und mögliche Änderungen findest Du hier: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Falls Du doch nicht teilnehmen kannst, melde Dich bitte dort ab, damit jemand anderes Deinen Platz bekommt.</p>
  <p>Viele Grüße<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName],</p>
  <p>Your participation in <strong>[Enrollment:CourseId--Course:Name]</strong> is confirmed. Great to have you!</p>
  [#if:CourseDateTime]<p><strong>When:</strong> [Course:DateTime]</p>[/if:CourseDateTime]
  [#if:CourseLocation]<p style="margin-bottom:0;"><strong>Where:</strong></p>[Course:LocationList][/if:CourseLocation]
  [#if:Calendar]<p>The attached calendar file lets you add the dates to your calendar.</p>[/if:Calendar]
  [#if:Online]<p>You will get the access link for online participation with the reminder email before the start; it is also on the page linked below.</p>[/if:Online]
  <p>All details and any changes are here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>If you can no longer attend, please cancel your registration there so someone else can have your place.</p>
  <p>Best regards<br>The EduHub Team</p>
</body>
</html>',
    "updated_at" = NOW()
WHERE "type" = 'APPLICATION_CONFIRMED' AND "courseId" IS NULL;

UPDATE "public"."MailTemplate"
SET "content" = '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- Deutsch -->
  <p>Moin [User:FirstName],</p>
  <p>gute Nachrichten! Für <strong>[Enrollment:CourseId--Course:Name]</strong> ist ein Platz frei geworden und Du bist von der Warteliste nachgerückt. Deine Teilnahme ist bestätigt, Du musst nichts weiter tun.</p>
  [#if:CourseDateTime]<p><strong>Wann:</strong> [Course:DateTime]</p>[/if:CourseDateTime]
  [#if:CourseLocation]<p style="margin-bottom:0;"><strong>Wo:</strong></p>[Course:LocationList][/if:CourseLocation]
  [#if:Calendar]<p>Im Anhang findest Du eine Kalenderdatei, mit der Du die Termine in Deinen Kalender übernehmen kannst.</p>[/if:Calendar]
  [#if:Online]<p>Den Zugangslink für online bekommst Du mit der Erinnerungsmail vor dem Start; er steht auch auf der Seite unten.</p>[/if:Online]
  <p>Alle Infos und mögliche Änderungen findest Du hier: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Falls Du doch nicht teilnehmen kannst, melde Dich bitte dort ab, damit jemand anderes Deinen Platz bekommt.</p>
  <p>Viele Grüße<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName],</p>
  <p>Good news! A place has opened up for <strong>[Enrollment:CourseId--Course:Name]</strong> and you have been moved up from the waitlist. Your participation is confirmed, there is nothing else you need to do.</p>
  [#if:CourseDateTime]<p><strong>When:</strong> [Course:DateTime]</p>[/if:CourseDateTime]
  [#if:CourseLocation]<p style="margin-bottom:0;"><strong>Where:</strong></p>[Course:LocationList][/if:CourseLocation]
  [#if:Calendar]<p>The attached calendar file lets you add the dates to your calendar.</p>[/if:Calendar]
  [#if:Online]<p>You will get the access link for online participation with the reminder email before the start; it is also on the page linked below.</p>[/if:Online]
  <p>All details and any changes are here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>If you can no longer attend, please cancel your registration there so someone else can have your place.</p>
  <p>Best regards<br>The EduHub Team</p>
</body>
</html>',
    "updated_at" = NOW()
WHERE "type" = 'WAITLIST_CONFIRMED' AND "courseId" IS NULL;

-- The paid confirmation carries the full AGB, so it is not rewritten: only its
-- date line is swapped for the when/where block, in its lowercase "du". A
-- text whose date line was edited is left alone.
UPDATE "public"."MailTemplate"
SET "content" = regexp_replace("content",
      '<p>\s*Datum:\s*\[Course:StartTime\]\s*-\s*\[Course:EndTime\]\s*<br\s*/?>',
      '[#if:CourseDateTime]<p><strong>Wann:</strong> [Course:DateTime]</p>[/if:CourseDateTime][#if:CourseLocation]<p style="margin-bottom:0;"><strong>Wo:</strong></p>[Course:LocationList][/if:CourseLocation][#if:Calendar]<p>Im Anhang findest du eine Kalenderdatei, mit der du die Termine in deinen Kalender übernehmen kannst.</p>[/if:Calendar][#if:Online]<p>Den Zugangslink für online bekommst du mit der Erinnerungsmail vor dem Start; er steht auch auf der Seite der Veranstaltung.</p>[/if:Online]<p>'),
    "updated_at" = NOW()
WHERE "type" = 'REGISTRATION_CONFIRMED_PAID' AND "courseId" IS NULL;
