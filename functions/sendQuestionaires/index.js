
const { createClient } = require("graphqurl");

exports.sendQuestionaires = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    
    const client = createClient({
      //endpoint: 'http://localhost:8080/v1/graphql',
      endpoint: process.env.HASURA_ENDPOINT,
      headers: {
        "x-access-key": process.env.HASURA_ADMIN_SECRET,
        "X-Hasura-Role": "admin",
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
      },
    });
    
 
    //get courses with sessions
    let courses;
    await client
      .query({
        query:
          `query { 
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
                  }
                }
                Program {
                  startQuestionnaire
                  speakerQuestionnaire
                  closingQuestionnaire
                  title
                }
                CourseEnrollments(where: {status: {_eq: CONFIRMED}}) {
                  User {
                    id
                    email
                    firstName
                    lastName
                  }
                }
              }
            }`,
        variables: { },
      })
      .then((response) => {
        courses = response.data.Course;
      })
      .catch((error) => console.error(error));
    
    for (const course of courses) {
      const firstsession = course.Sessions[0];
      const lastsession = course.Sessions.slice(-1)[0];
      for (const session of course.Sessions) {
        if (!session.questionaire_sent && Date.parse(session.endDateTime) <= Date.now()) {
          for (const enrollment of course.CourseEnrollments) {
            
            //send start questionaire
            if (course.Program.startQuestionnaire && session.id == firstsession.id) {
              await client
              .query({
                query:`
                  mutation($subject : String, $to : String, $from : String, $content : String) {
                    insert_MailLog_one(object: {subject: $subject, to: $to, from: $from, content: $content}) {
                      id
                    }
                  }
                `,
                variables: {
                  subject: `Feedback zu ${course.title} bei opencampus.sh`,
                  to: enrollment.User.email,
                  from: "noreply@edu.opencampus.sh",
                  content: 
                  `<!DOCTYPE html>
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
                  </html>`
                },
              })
              .then((response) => {})
              .catch((error) => console.error(error));
            }
            
            //send speaker questionaire
            if (course.Program.speakerQuestionnaire && session.SessionSpeakers.length > 0) {
              await client
              .query({
                query:`
                  mutation($subject : String, $to : String, $from : String, $content : String) {
                    insert_MailLog_one(object: {subject: $subject, to: $to, from: $from, content: $content}) {
                      id
                    }
                  }
                `,
                variables: {
                  subject: `Feedback zu ${session.title} bei opencampus.sh`,
                  to: enrollment.User.email,
                  from: "noreply@edu.opencampus.sh",
                  content: 
                  `<!DOCTYPE html>
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
                  </html>`
                },
              })
              .then((response) => {})
              .catch((error) => console.error(error));
            }
          
          //send closing questionaire
          if (course.Program.closingQuestionnaire && session.id == lastsession.id) {
            await client
            .query({
              query:`
                mutation($subject : String, $to : String, $from : String, $content : String) {
                  insert_MailLog_one(object: {subject: $subject, to: $to, from: $from, content: $content}) {
                    id
                  }
                }
              `,
              variables: {
                subject: `Feedback zu ${course.title} bei opencampus.sh`,
                to: enrollment.User.email,
                from: "noreply@edu.opencampus.sh",
                content: 
                `<!DOCTYPE html>
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
                </html>`
              },
            })
            .then((response) => {})
            .catch((error) => console.error(error));
          }
        }
          
          // set questionaire_sent to true
          await client
          .query({
            query:`
              mutation($id : Int!) {
                update_Session_by_pk(pk_columns: {id: $id}, _set: {questionaire_sent: true}) {
                  title
                }
              }
            `,
            variables: {
              id: session.id,
            },
          })
          .then((response) => {})
          .catch((error) => console.error(error));
          
        }
      }
    }

    return res.json({
      result: "questionaires sent",
    });
  }
};
