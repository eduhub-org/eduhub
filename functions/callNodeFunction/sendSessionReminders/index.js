import { gql, GraphQLClient } from 'graphql-request';

/**
 * Sends session reminder emails for upcoming course sessions
 * ONLY sends reminders for the FIRST session in each course
 * Uses MailLog metadata to track sent reminders (no separate table needed)
 * 
 * @param {Object} req - Request object (can be from cron or manual trigger)
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Response object
 */
export default async function sendSessionReminders(req, logger) {
  logger.info("########## Send Session Reminders ##########");
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    // Create GraphQL client
    const client = new GraphQLClient(process.env.HASURA_GRAPHQL_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
    });

    const now = new Date();
    const reminderWindows = [
      { type: '24_HOURS', hours: 24, tolerance: 0.25 }, // 24 hours ± 15 minutes
      { type: '1_HOUR', hours: 1, tolerance: 0.25 },    // 1 hour ± 15 minutes
      { type: '15_MINUTES', hours: 0.25, tolerance: 0.1 } // 15 minutes ± 6 minutes
    ];

    let totalEmailsSent = 0;
    const processedSessions = [];

    for (const window of reminderWindows) {
      const targetTime = new Date(now.getTime() + window.hours * 60 * 60 * 1000);
      const toleranceMs = window.tolerance * 60 * 60 * 1000;
      const startTime = new Date(targetTime.getTime() - toleranceMs);
      const endTime = new Date(targetTime.getTime() + toleranceMs);

      logger.info(`Processing ${window.type} reminders for FIRST sessions between ${startTime.toISOString()} and ${endTime.toISOString()}`);

      // Find sessions that need reminders - ONLY first session in each course
      const GET_SESSIONS_FOR_REMINDERS = gql`
        query GetSessionsForReminders($startTime: timestamptz!, $endTime: timestamptz!) {
          Course(
            where: {
              Sessions: {
                startDateTime: { _gte: $startTime, _lte: $endTime }
              }
              CourseEnrollments: {
                status: { _eq: "CONFIRMED" }
              }
            }
          ) {
            id
            title
            # Get the first session (earliest startDateTime) for this course that falls within the reminder window
            Sessions(
              where: {
                startDateTime: { _gte: $startTime, _lte: $endTime }
              }
              order_by: { startDateTime: asc }
              limit: 1
            ) {
              id
              title
              startDateTime
              endDateTime
            }
            # Get all sessions for this course to determine if this is the first session
            AllSessions: Sessions(order_by: { startDateTime: asc }) {
              id
              startDateTime
            }
            CourseEnrollments(where: { status: { _eq: "CONFIRMED" } }) {
              id
              User {
                id
                firstName
                lastName
                email
              }
            }
          }
        }
      `;

      const coursesData = await client.request(GET_SESSIONS_FOR_REMINDERS, {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });

      if (!coursesData?.Course?.length) {
        logger.info(`No courses with sessions found for ${window.type} reminders`);
        continue;
      }

      // Filter to only process courses where the session in the reminder window is the first session
      const validSessions = [];
      coursesData.Course.forEach(course => {
        if (course.Sessions.length > 0 && course.AllSessions.length > 0) {
          const sessionInWindow = course.Sessions[0]; // Session within reminder window
          const firstSessionInCourse = course.AllSessions[0]; // First session in course
          
          // Only process if the session in the reminder window is the first session of the course
          if (sessionInWindow.id === firstSessionInCourse.id) {
            validSessions.push({
              id: sessionInWindow.id,
              title: sessionInWindow.title,
              startDateTime: sessionInWindow.startDateTime,
              endDateTime: sessionInWindow.endDateTime,
              Course: {
                id: course.id,
                title: course.title,
                CourseEnrollments: course.CourseEnrollments
              }
            });
          }
        }
      });

      if (!validSessions.length) {
        logger.info(`No first sessions found for ${window.type} reminders`);
        continue;
      }

      // Check which reminders have already been sent using MailLog metadata
      const sessionIds = validSessions.map(s => s.id);
      const GET_SENT_REMINDERS = gql`
        query GetSentReminders($sessionIds: [Int!]!) {
          MailLog(
            where: {
              metadata: { _contains: { type: "SESSION_REMINDER" } }
              status: { _in: ["SENT", "READY_TO_SEND"] }
            }
          ) {
            metadata
            to
          }
        }
      `;

      const sentRemindersData = await client.request(GET_SENT_REMINDERS, {
        sessionIds: sessionIds
      });

      // Create a set of already sent reminders: "sessionId:userId:reminderType"
      const sentReminders = new Set();
      sentRemindersData?.MailLog?.forEach(mail => {
        const metadata = mail.metadata;
        if (metadata?.sessionId && metadata?.userId && metadata?.reminderType) {
          sentReminders.add(`${metadata.sessionId}:${metadata.userId}:${metadata.reminderType}`);
        }
      });

      // Get email template for reminders
      const GET_EMAIL_TEMPLATE = gql`
        query GetEmailTemplate($title: String!) {
          MailTemplate(where: { title: { _eq: $title } }) {
            id
            subject
            content
            from
            cc
            bcc
          }
        }
      `;

      const templateData = await client.request(GET_EMAIL_TEMPLATE, {
        title: 'SESSION_REMINDER'
      });

      if (!templateData?.MailTemplate?.length) {
        logger.error('SESSION_REMINDER email template not found');
        continue;
      }

      const template = templateData.MailTemplate[0];

      // Process each session
      for (const session of validSessions) {
        let sessionEmailsSent = 0;

        for (const enrollment of session.Course.CourseEnrollments) {
          const reminderKey = `${session.id}:${enrollment.User.id}:${window.type}`;
          
          if (sentReminders.has(reminderKey)) {
            continue; // Already sent this reminder type to this user
          }

          // Calculate reminder text based on type
          let reminderText, reminderTime;
          switch (window.type) {
            case '24_HOURS':
              reminderText = 'starts tomorrow';
              reminderTime = 'tomorrow';
              break;
            case '1_HOUR':
              reminderText = 'starts in 1 hour';
              reminderTime = 'in 1 hour';
              break;
            case '15_MINUTES':
              reminderText = 'starts in 15 minutes';
              reminderTime = 'in 15 minutes';
              break;
            default:
              reminderText = 'is starting soon';
              reminderTime = 'soon';
          }

          // Calculate session duration
          const sessionStart = new Date(session.startDateTime);
          const sessionEnd = new Date(session.endDateTime);
          const durationMs = sessionEnd.getTime() - sessionStart.getTime();
          const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
          const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
          const duration = durationHours > 0 
            ? `${durationHours}h ${durationMinutes}m`
            : `${durationMinutes}m`;

          // Replace placeholders in email content
          const replaceVariables = (text) => {
            return text
              .replaceAll('[User:Firstname]', enrollment.User.firstName)
              .replaceAll('[User:LastName]', enrollment.User.lastName)
              .replaceAll('[Enrollment:CourseId--Course:Name]', session.Course.title)
              .replaceAll('[Enrollment:CourseLink]', `${process.env.FRONTEND_URL || 'https://edu.opencampus.sh'}/course/${session.Course.id}`)
              .replaceAll('[Session:Title]', session.title)
              .replaceAll('[Session:StartDateTime]', sessionStart.toLocaleString())
              .replaceAll('[Session:Duration]', duration)
              .replaceAll('[Session:ReminderText]', reminderText)
              .replaceAll('[Session:ReminderTime]', reminderTime);
          };

          const emailSubject = replaceVariables(template.subject);
          const emailContent = replaceVariables(template.content);

          // Insert email into MailLog with metadata for tracking
          const INSERT_MAIL_LOG = gql`
            mutation InsertMailLog(
              $subject: String!
              $content: String!
              $from: String!
              $to: String!
              $cc: String
              $bcc: String
              $status: String!
              $metadata: jsonb
            ) {
              insert_MailLog_one(
                object: {
                  subject: $subject
                  content: $content
                  from: $from
                  to: $to
                  cc: $cc
                  bcc: $bcc
                  status: $status
                  metadata: $metadata
                }
              ) {
                id
              }
            }
          `;

          const mailResult = await client.request(INSERT_MAIL_LOG, {
            subject: emailSubject,
            content: emailContent,
            from: template.from || 'noreply@opencampus.sh',
            to: enrollment.User.email,
            cc: template.cc,
            bcc: template.bcc,
            status: 'READY_TO_SEND',
            metadata: {
              type: 'SESSION_REMINDER',
              reminderType: window.type,
              sessionId: session.id,
              userId: enrollment.User.id,
              courseId: session.Course.id,
              sessionStartTime: session.startDateTime,
              sentAt: new Date().toISOString()
            }
          });

          totalEmailsSent++;
          sessionEmailsSent++;
          logger.info(`Sent ${window.type} reminder for FIRST session ${session.id} to user ${enrollment.User.id}, mailId: ${mailResult.insert_MailLog_one.id}`);
        }

        if (sessionEmailsSent > 0) {
          processedSessions.push({
            sessionId: session.id,
            sessionTitle: session.title,
            reminderType: window.type,
            emailsSent: sessionEmailsSent
          });
        }
      }
    }

    logger.info(`First session reminders processing completed. Total emails sent: ${totalEmailsSent}`);

    return {
      success: true,
      messageKey: 'SESSION_REMINDERS_PROCESSED',
      totalEmailsSent,
      processedSessions,
      processedAt: new Date().toISOString()
    };

  } catch (error) {
    logger.error(`Error sending session reminders: ${error.message}`, { error });
    return {
      success: false,
      error: error.message,
      messageKey: 'SESSION_REMINDERS_FAILED'
    };
  }
} 