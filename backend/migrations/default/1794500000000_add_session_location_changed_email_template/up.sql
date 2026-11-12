-- A session can be moved to other locations for just that session (e.g. online
-- only), and participants are told what changed: SESSION_LOCATION_CHANGED names
-- the places before and after (and the time when that changed too), and
-- SESSION_RESCHEDULED now names the previous time.

INSERT INTO "public"."MailTemplateType" ("value", "comment")
VALUES ('SESSION_LOCATION_CHANGED', 'Sent to active enrollees when a session takes place at other locations; also names a changed time')
ON CONFLICT ("value") DO NOTHING;

INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT 'SESSION_LOCATION_CHANGED', NULL,
  'Änderung / Session changed - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
  <p>Hallo [User:FirstName] [User:LastName],</p>
  [#if:TimeUnchanged]<p>der Ort für eine Session von <strong>[Enrollment:CourseId--Course:Name]</strong> hat sich geändert.</p>[/if:TimeUnchanged]
  [#if:TimeChanged]<p>Ort und Termin für eine Session von <strong>[Enrollment:CourseId--Course:Name]</strong> haben sich geändert.</p>[/if:TimeChanged]
  <p><strong>[Session:Title]</strong></p>
  [#if:TimeUnchanged]<p>Termin: [Session:DateTimeRange]</p>[/if:TimeUnchanged]
  [#if:TimeChanged]<p>Neuer Termin: [Session:DateTimeRange]<br><span style="color:#666;">Bisher: [Session:PreviousDateTimeRange]</span></p>[/if:TimeChanged]
  <p>Neuer Ort:</p>
  [Session:LocationList]
  <p style="color:#666;">Bisher:</p>
  <div style="color:#666;">[Session:PreviousLocationList]</div>
  <p>Den Link zur Online-Teilnahme und alle weiteren Details findest du hier: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin:2em 0;border:none;border-top:1px solid #ccc;" />
  <p>Hello [User:FirstName] [User:LastName],</p>
  [#if:TimeUnchanged]<p>The location of a session for <strong>[Enrollment:CourseId--Course:Name]</strong> has changed.</p>[/if:TimeUnchanged]
  [#if:TimeChanged]<p>The location and time of a session for <strong>[Enrollment:CourseId--Course:Name]</strong> have changed.</p>[/if:TimeChanged]
  <p><strong>[Session:Title]</strong></p>
  [#if:TimeUnchanged]<p>Time: [Session:DateTimeRange]</p>[/if:TimeUnchanged]
  [#if:TimeChanged]<p>New time: [Session:DateTimeRange]<br><span style="color:#666;">Previously: [Session:PreviousDateTimeRange]</span></p>[/if:TimeChanged]
  <p>New location:</p>
  [Session:LocationList]
  <p style="color:#666;">Previously:</p>
  <div style="color:#666;">[Session:PreviousLocationList]</div>
  <p>You can find the link for joining online and all other details here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
</body></html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'SESSION_LOCATION_CHANGED' AND "courseId" IS NULL);

-- Only the default as it was seeded: a text an admin edited stays theirs, and
-- [Session:PreviousDateTimeRange] is available to add by hand.
UPDATE "public"."MailTemplate"
SET "content" = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
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
</body></html>',
    "updated_at" = NOW()
WHERE "type" = 'SESSION_RESCHEDULED'
  AND "courseId" IS NULL
  AND md5("content") = md5('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
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
  </body></html>');
