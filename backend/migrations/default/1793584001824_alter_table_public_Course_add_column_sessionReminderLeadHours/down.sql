UPDATE "public"."MailTemplate"
SET
  "subject" = 'Course Reminder - [Enrollment:CourseId--Course:Name] starts [Session:ReminderTime]',
  "content" =   '<!DOCTYPE html>
  <html>
    <head>
      <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    </head>
    <body>
      <p>Hello [User:Firstname] [User:LastName],</p>
      <p>This is a friendly reminder that your course <strong>[Enrollment:CourseId--Course:Name]</strong> [Session:ReminderText].</p>
      <p>Session details:</p>
      <ul>
        <li><strong>Session:</strong> [Session:Title]</li>
        <li><strong>Date & Time:</strong> [Session:StartDateTime]</li>
        <li><strong>Duration:</strong> [Session:Duration]</li>
      </ul>
      <p>Don''t forget to:</p>
      <ul>
        <li>Join on time</li>
        <li>Have your materials ready</li>
        <li>Check the course page for any last-minute updates: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></li>
      </ul>
      <p>We look forward to seeing you!</p>
      <p>Best regards,<br>The EduHub Team</p>
    </body>
  </html>'
WHERE "type" = 'SESSION_REMINDER' AND "courseId" IS NULL;

UPDATE "public"."MailTemplateType" SET "comment" = 'Sent before sessions start' WHERE "value" = 'SESSION_REMINDER';

ALTER TABLE "public"."Course" DROP COLUMN IF EXISTS "sessionReminderLeadHours";
