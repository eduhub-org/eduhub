UPDATE "public"."MailTemplate"
SET "content" = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
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
    "updated_at" = NOW()
WHERE "type" = 'SESSION_RESCHEDULED'
  AND "courseId" IS NULL
  AND md5("content") = md5('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>der Termin für eine Session von <strong>[Enrollment:CourseId--Course:Name]</strong> hat sich geändert.</p>
  <p><strong>[Session:Title]</strong></p>
  <p>Neuer Termin: [Session:DateTimeRange][#if:PreviousTime]<br><span style="color:#666;">Bisher: [Session:PreviousDateTimeRange]</span>[/if:PreviousTime]</p>
  <p>Alle Details findest du hier: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>The time of a session for <strong>[Enrollment:CourseId--Course:Name]</strong> has changed.</p>
  <p><strong>[Session:Title]</strong></p>
  <p>New time: [Session:DateTimeRange][#if:PreviousTime]<br><span style="color:#666;">Previously: [Session:PreviousDateTimeRange]</span>[/if:PreviousTime]</p>
  <p>You can find all details here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
</body></html>');

DELETE FROM "public"."MailTemplate" WHERE "type" = 'SESSION_LOCATION_CHANGED';
DELETE FROM "public"."MailTemplateType" WHERE "value" = 'SESSION_LOCATION_CHANGED';
