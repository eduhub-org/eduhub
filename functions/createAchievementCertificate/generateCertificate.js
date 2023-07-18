import got from "got";
import Storage from "@google-cloud/storage";
import { request, gql } from "graphql-request";

// import { buildCloudStorage } from "../lib/cloud-storage.js";

export const generateCertificate = async (courseEnrollment, bucket) => {
  try {
    // set online_courses and practical_project according to recordType
    const recordType =
      courseEnrollment.User.AchievementRecordAuthors[0].AchievementRecord
        .AchievementOption.recordType;
    const recordTitle =
      courseEnrollment.User.AchievementRecordAuthors[0].AchievementRecord
        .AchievementOption.title;
    const online_courses = recordType === "ONLINE_COURSE" ? "" : recordTitle;
    const practical_project = recordType === "DOCUMENTATION" ? "" : recordTitle;

    // set certificate text to learning goals or empty string if learning goals is null
    const certificate = courseEnrollment.Course.learningGoals || "";

    // Construct the options object for the certificate generation request
    const options = {
      json: {
        template:
          courseEnrollment.Course.Program.attendanceCertificateTemplateURL,
        full_name: `${courseEnrollment.User.firstName} ${courseEnrollment.User.lastName}`,
        semester: courseEnrollment.Course.Program.title,
        course_name: courseEnrollment.Course.title,
        ects: courseEnrollment.Course.ects,
        practical_project: practical_project,
        online_courses: online_courses,
        certificate_text: certificate,
      },
    };

    // Send the certificate generation request to the certificate generation service
    const url = "https://edu-old.opencampus.sh/create_certificate_rest";
    const certificateData = await got.post(url, options).json();

    //log the certificate data
    console.log("############# Certificate data: " + certificateData);

    // Saving the certificate to the Google Cloud bucket
    const { buildCloudStorage } = process.env.LIBRARY_PATH
      ? await import(process.env.LIBRARY_PATH)
      : await import("./lib/cloud-storage.js");

    const content = certificateData.pdf;
    const userid = courseEnrollment.User.id;
    const courseId = courseEnrollment.Course.id;
    const path = `userid_${userid}/courseid_${courseId}/achievement_certificate_course_${courseId}.pdf`;
    const isPublic = false;

    const storage = buildCloudStorage(Storage);
    const link = await storage.saveToBucket(path, bucket, content, isPublic);
    console.log("Certificate saved to bucket: ", link);
    // Saving the link to the course enrollment record
    const mutation = gql`
      mutation UpdateEnrollment(
        $userId: uuid!
        $courseId: Int!
        $certificateURL: String!
      ) {
        update_CourseEnrollment(
          where: { userId: { _eq: $userId }, courseId: { _eq: $courseId } }
          _set: { achievementCertificateURL: $certificateURL }
        ) {
          affected_rows
        }
      }
    `;
    const mutationVariables = {
      userId: userid,
      courseId: courseId,
      certificateURL: link,
    };
    await request(process.env.HASURA_ENDPOINT, mutation, mutationVariables, {
      "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
    });
  } catch (error) {
    console.error("Error while generating certificate: ", error);
    throw error;
  }
};
