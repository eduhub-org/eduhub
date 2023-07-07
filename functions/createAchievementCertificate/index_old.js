import got from 'got';

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
export const createAchievementCertificate = async (req, res) => {

  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const template = req.body.input.template;
    const firstname = req.body.input.firstname;
    const lastname = req.body.input.lastname;
    const semester = req.body.input.semester;
    const course_name = req.body.input.course_name;
    const ects = req.body.input.ects;
    const practical_project = req.body.input.ractical_project;
    const online_courses = req.body.input.online_courses;
    const certificate_text = req.body.input.certificate_text;
    
    const url = 'https://edu-old.opencampus.sh/create_certificate_rest';
    const options = {
      json: {
        template: template,
        full_name: firstname + " " + lastname,
        semester: semester,
        course_name: course_name,
        ects: ects,
        practical_project: practical_project,
        online_courses: online_courses,
        certificate_text: certificate_text,
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
