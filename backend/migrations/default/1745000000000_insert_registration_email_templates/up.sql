-- Insert email templates for registration process
INSERT INTO "public"."MailTemplate"("subject", "content", "from", "title") VALUES 
(
  'Application Received - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
  <html>
    <head>
      <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    </head>
    <body>
      <p>Hello [User:Firstname] [User:LastName],</p>
      <p>Thank you for your application to <strong>[Enrollment:CourseId--Course:Name]</strong>.</p>
      <p>We have received your application and it is currently being reviewed by our team. You will receive a notification once a decision has been made.</p>
      <p>Course details:</p>
      <ul>
        <li><strong>Course:</strong> [Enrollment:CourseId--Course:Name]</li>
        <li><strong>Application submitted:</strong> [Enrollment:CreatedAt]</li>
      </ul>
      <p>You can view your application status at any time by visiting: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
      <p>If you have any questions, please don''t hesitate to contact us.</p>
      <p>Best regards,<br>The EduHub Team</p>
    </body>
  </html>',
  'noreply@opencampus.sh',
  'APPLICATION_RECEIVED'
),
(
  'Application Confirmed - Welcome to [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
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
  'noreply@opencampus.sh',
  'APPLICATION_CONFIRMED'
),
(
  'Course Reminder - [Enrollment:CourseId--Course:Name] starts [Session:ReminderTime]',
  '<!DOCTYPE html>
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
  </html>',
  'noreply@opencampus.sh',
  'SESSION_REMINDER'
),
(
  'Invitation to [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
  <html>
    <head>
      <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    </head>
    <body>
      <p>Hello [User:Firstname] [User:LastName],</p>
      <p>Great news! You have been invited to participate in <strong>[Enrollment:CourseId--Course:Name]</strong>.</p>
      <p>Your application has been reviewed and we are pleased to offer you a place in this course.</p>
      <p>Course details:</p>
      <ul>
        <li><strong>Course:</strong> [Enrollment:CourseId--Course:Name]</li>
        <li><strong>Course page:</strong> <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></li>
      </ul>
      <p><strong>Important:</strong> Please confirm your participation by <strong>[Enrollment:ExpirationDate]</strong>. If we don''t hear from you by this date, your spot may be offered to another applicant.</p>
      <p>To confirm your participation, please visit the course page and click the confirmation button.</p>
      <p>We look forward to having you in the course!</p>
      <p>Best regards,<br>The EduHub Team</p>
    </body>
  </html>',
  'noreply@opencampus.sh',
  'INVITE'
),
(
  'Application Update - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
  <html>
    <head>
      <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    </head>
    <body>
      <p>Hello [User:Firstname] [User:LastName],</p>
      <p>Thank you for your interest in <strong>[Enrollment:CourseId--Course:Name]</strong>.</p>
      <p>After careful consideration of all applications, we regret to inform you that we are unable to offer you a place in this course at this time.</p>
      <p>This decision was difficult as we received many excellent applications. We encourage you to:</p>
      <ul>
        <li>Apply for other courses that match your interests</li>
        <li>Check our course catalog regularly for new offerings: <a href="[Enrollment:CourseLink]">Browse Courses</a></li>
        <li>Consider joining our mailing list for updates on future courses</li>
      </ul>
      <p>Thank you for your understanding, and we hope to see you in future courses.</p>
      <p>Best regards,<br>The EduHub Team</p>
    </body>
  </html>',
  'noreply@opencampus.sh',
  'DECLINE'
),
(
  'Registration Confirmed - Welcome to [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
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
  'noreply@opencampus.sh',
  'REGISTRATION_CONFIRMED'
) 
ON CONFLICT ("title") DO NOTHING;