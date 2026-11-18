import { gql } from 'graphql-request';
import { createHasuraClient } from '../lib/hasura.js';

// Cron (send_questionaires, every two hours): queues the feedback
// questionnaire mails of a Program for sessions that have ended and marks the
// session sent. Formerly its own unit (functions/sendQuestionaires); the mail
// texts are unchanged.

const COURSES_WITH_SESSIONS = gql`query { 
            Course(where: {Program: {published: {_eq: true}}, published: {_eq: true}}) {
                id
                title
                Sessions(order_by: {startDateTime: asc}) {
                  id
                  title
                  endDateTime
                  startDateTime
                  questionaire_sent
                  SessionSpeakers {
                    id
                    userId
                  }
                }
                Program {
                  startQuestionnaire
                  speakerQuestionnaire
                  closingQuestionnaire
                  title
                }
                CourseEnrollments(where: {isTest: {_eq: false}, status: {_eq: CONFIRMED}}) {
                  User {
                    id
                    email
                    firstName
                    lastName
                  }
                }
                CourseInstructors {
                  userId
                }
              }
            }`;

const INSERT_MAIL_LOG = gql`
  mutation($subject : String, $to : String, $from : String, $content : String) {
    insert_MailLog_one(object: {subject: $subject, to: $to, from: $from, content: $content}) {
      id
    }
  }
`;

const MARK_QUESTIONAIRE_SENT = gql`
  mutation($id : Int!) {
    update_Session_by_pk(pk_columns: {id: $id}, _set: {questionaire_sent: true}) {
      title
    }
  }
`;

/** @type {import('../lib/types.js').Handler} */
const sendQuestionaires = async (req, logger) => {
  const client = createHasuraClient();

  //get courses with sessions
  let courses;
  try {
    const response = await client.request(COURSES_WITH_SESSIONS, {});
    courses = response.Course;
  } catch (error) {
    // The old unit crashed here, which the platform answered with a 500.
    logger.error('Could not load courses for questionnaires', { error: error.message });
    return { httpStatus: 500, success: false, error: 'Could not load courses', messageKey: 'COURSES_NOT_LOADED' };
  }

  for (const course of courses) {
    const firstsession = course.Sessions[0];
    const lastsession = course.Sessions.slice(-1)[0];
    for (const session of course.Sessions) {

      var doSpeakerQuestionaire = false;
      for (const sessionSpeaker of session.SessionSpeakers) {
        var isInstructor = false;
        for (const courseInstructor of course.CourseInstructors) {
          if (courseInstructor.userId == sessionSpeaker.userId) {
            isInstructor = true;
          }
        }
        if (!isInstructor) {
          doSpeakerQuestionaire = true;
        }
      }

      if (!session.questionaire_sent && Date.parse(session.endDateTime) <= Date.now()) {
        for (const enrollment of course.CourseEnrollments) {

          //send start questionaire
          if (course.Program.startQuestionnaire && session.id == firstsession.id) {
            try {
              await client.request(INSERT_MAIL_LOG, {
                subject: `Feedback zu ${course.title} bei opencampus.sh`,
                to: enrollment.User.email,
                from: "noreply@edu.opencampus.sh",
                content: `<!DOCTYPE html>
                <html>
                  <head>
                    <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
                  </head>
                  <body>
                    <p>Hallo ${enrollment.User.firstName} ${enrollment.User.lastName},</p>
                    <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses ${course.title} bei opencampus.sh.</p>
                    <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>

                    <p><a href="${course.Program.startQuestionnaire}?&c=${course.title}&t=${session.title}&p=${course.Program.title}"> Zum Fragebogen </a></p>

                    <p>Viele Grüße</p>
                    <p>Dein opencampus.sh Team</p>
                  </body>
                </html>`,
              });
            } catch (error) {
              logger.error(error.message);
            }
          }

          //send speaker questionaire
          if (course.Program.speakerQuestionnaire && session.SessionSpeakers.length > 0 && doSpeakerQuestionaire) {
            try {
              await client.request(INSERT_MAIL_LOG, {
                subject: `Feedback zu ${session.title} bei opencampus.sh`,
                to: enrollment.User.email,
                from: "noreply@edu.opencampus.sh",
                content: `<!DOCTYPE html>
                <html>
                  <head>
                    <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
                  </head>
                  <body>
                    <p>Hallo ${enrollment.User.firstName} ${enrollment.User.lastName},</p>
                    <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation der Veranstaltung ${session.title} im Rahmen Deines Kurses ${course.title} bei opencampus.sh.</p>
                    <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>

                    <p><a href="${course.Program.speakerQuestionnaire}?&c=${course.title}&t=${session.title}&p=${course.Program.title}"> Zum Fragebogen </a></p>

                    <p>Viele Grüße</p>
                    <p>Dein opencampus.sh Team</p>
                  </body>
                </html>`,
              });
            } catch (error) {
              logger.error(error.message);
            }
          }

          //send closing questionaire
          if (course.Program.closingQuestionnaire && session.id == lastsession.id) {
            try {
              await client.request(INSERT_MAIL_LOG, {
                subject: `Feedback zu ${course.title} bei opencampus.sh`,
                to: enrollment.User.email,
                from: "noreply@edu.opencampus.sh",
                content: `<!DOCTYPE html>
              <html>
                <head>
                  <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
                </head>
                <body>
                  <p>Hallo ${enrollment.User.firstName} ${enrollment.User.lastName},</p>
                  <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses ${course.title} bei opencampus.sh.</p>
                  <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>

                  <p><a href="${course.Program.closingQuestionnaire}?&c=${course.title}&t=${session.title}&p=${course.Program.title}"> Zum Fragebogen </a></p>

                  <p>Viele Grüße</p>
                  <p>Dein opencampus.sh Team</p>
                </body>
              </html>`,
              });
            } catch (error) {
              logger.error(error.message);
            }
          }
        }

        // set questionaire_sent to true
        try {
          await client.request(MARK_QUESTIONAIRE_SENT, { id: session.id });
        } catch (error) {
          logger.error(error.message);
        }

      }
    }
  }


  return { result: 'questionaires sent' };
};

export default sendQuestionaires;
