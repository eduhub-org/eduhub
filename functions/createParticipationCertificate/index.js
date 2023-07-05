import got from 'got';

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
export const createParticipationCertificate = async (req, res) => {

  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const template = req.body.input.template;
    const firstname = req.body.input.firstname;
    const lastname = req.body.input.lastname;
    const semester = req.body.input.semester;
    const course_name = req.body.input.course_name;
    const event_entries = req.body.input.event_entries;
    
    const url = 'https://edu-old.opencampus.sh/create_attendence_certificate_rest';
    const options = {
      json: {
        template: template,
        full_name: firstname + " " + lastname,
        semester: semester,
        course_name: course_name,
        event_entries: event_entries
      },
    };
    
    const data = await got.post(url, options).json();

    return res.json({
      pdf: data.pdf
    });
  } else {
    return res.json({
      response: "error",
    });
  }
};
