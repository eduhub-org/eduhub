-- Restores the seeded texts, only where the text is still the one up.sql
-- wrote. Texts edited in production before up.sql are not recoverable here.

UPDATE "public"."MailTemplate"
SET "content" = '<!DOCTYPE html>
  <html>
    <head>
      <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    </head>
    <body>
      <p>Hello [User:Firstname] [User:LastName],</p>
      <p>Thank you for registering for <strong>[Enrollment:CourseId--Course:Name]</strong>!</p>
      <p>Your registration has been confirmed and you''re all set to participate.</p>
      <p>Event details:</p>
      <ul>
        <li><strong>Course/Event:</strong> [Enrollment:CourseId--Course:Name]</li>
        <li><strong>Start Date:</strong> [Course:StartTime]</li>
        <li><strong>End Date:</strong> [Course:EndTime]</li>
        <li><strong>Registration Date:</strong> [Enrollment:CreatedAt]</li>
      </ul>
      <p>What''s next:</p>
      <ol>
        <li>Mark your calendar for the event dates</li>
        <li>Check your event page regularly for updates: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></li>
        <li>You''ll receive reminder emails before the event starts</li>
      </ol>
      <p>We look forward to seeing you at the event!</p>
      <p>Best regards,<br>The EduHub Team</p>
    </body>
  </html>',
    "updated_at" = NOW()
WHERE "type" = 'REGISTRATION_CONFIRMED' AND "courseId" IS NULL
  AND md5("content") = md5('<!DOCTYPE html>
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
</html>');

UPDATE "public"."MailTemplate"
SET "content" = '<!DOCTYPE html>
  <html>
    <head>
      <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    </head>
    <body>
      <p>Hello [User:Firstname] [User:LastName],</p>
      <p>Congratulations! Your participation in <strong>[Enrollment:CourseId--Course:Name]</strong> has been confirmed.</p>
      <p>Course details:</p>
      <ul>
        <li><strong>Course:</strong> [Enrollment:CourseId--Course:Name]</li>
        <li><strong>Start Date:</strong> [Course:StartTime]</li>
        <li><strong>End Date:</strong> [Course:EndTime]</li>
      </ul>
      <p>Next steps:</p>
      <ol>
        <li>Mark your calendar for the course dates</li>
        <li>Check your course page regularly for updates: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></li>
        <li>Prepare any required materials (details will be provided closer to the start date)</li>
      </ol>
      <p>We look forward to seeing you in the course!</p>
      <p>Best regards,<br>The EduHub Team</p>
    </body>
  </html>',
    "updated_at" = NOW()
WHERE "type" = 'APPLICATION_CONFIRMED' AND "courseId" IS NULL
  AND md5("content") = md5('<!DOCTYPE html>
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
</html>');

UPDATE "public"."MailTemplate"
SET "content" = '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>gute Nachrichten! Für <strong>[Enrollment:CourseId--Course:Name]</strong> ist ein Platz frei geworden und du bist von der Warteliste nachgerückt. Deine Teilnahme ist bestätigt – du musst nichts weiter tun.</p>
  <p>Alle Infos zur Veranstaltung findest du hier: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Falls du doch nicht teilnehmen kannst, melde dich bitte dort wieder ab, damit der Platz an die nächste Person gehen kann.</p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Good news! A spot has opened up for <strong>[Enrollment:CourseId--Course:Name]</strong> and you have been moved up from the waitlist. Your participation is confirmed – there is nothing else you need to do.</p>
  <p>You can find all details about the event here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>If you can no longer attend, please cancel your registration there so the spot can go to the next person.</p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
    "updated_at" = NOW()
WHERE "type" = 'WAITLIST_CONFIRMED' AND "courseId" IS NULL
  AND md5("content") = md5('<!DOCTYPE html>
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
</html>');

UPDATE "public"."MailTemplate"
SET "content" = replace("content", '[#if:CourseDateTime]<p><strong>Wann:</strong> [Course:DateTime]</p>[/if:CourseDateTime][#if:CourseLocation]<p style="margin-bottom:0;"><strong>Wo:</strong></p>[Course:LocationList][/if:CourseLocation][#if:Calendar]<p>Im Anhang findest du eine Kalenderdatei, mit der du die Termine in deinen Kalender übernehmen kannst.</p>[/if:Calendar][#if:Online]<p>Den Zugangslink für online bekommst du mit der Erinnerungsmail vor dem Start; er steht auch auf der Seite der Veranstaltung.</p>[/if:Online]<p>', '<p>Datum: [Course:StartTime] - [Course:EndTime]<br />'),
    "updated_at" = NOW()
WHERE "type" = 'REGISTRATION_CONFIRMED_PAID' AND "courseId" IS NULL;
