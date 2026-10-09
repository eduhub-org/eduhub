import { GraphQLClient } from 'graphql-request';
import { isOrgAdminOfCourse } from './orgAdminScope.js';

/**
 * Who may upload a file for a record through the generic saveImage / saveFile
 * actions.
 *
 * The record id in the storage path (`${courseid}`, `${projectid}`, ...) is
 * caller input, and the file name is too. Without a check anyone allowed to
 * call the action could overwrite another record's public file by sending its
 * id and the file name from its URL. Each rule below mirrors the Hasura update
 * permission on the column that stores the file, so whoever may point the
 * record at a file may also upload it.
 *
 * Wrappers that authorize on their own (saveOrganizationLogo,
 * saveProjectDocumentationInstruction) call the unchecked upload directly.
 */

const ADMIN_ROLE = 'admin';

const GET_COURSE_INSTRUCTOR = `
  query UploadCourseInstructor($id: Int!, $userId: uuid!) {
    CourseInstructor(where: { courseId: { _eq: $id }, userId: { _eq: $userId } }, limit: 1) {
      id
    }
  }
`;

const GET_PROJECT_ACCESS = `
  query UploadProjectAccess($id: Int!, $userId: uuid!) {
    Project_by_pk(id: $id) {
      status
      ProjectCourses {
        courseId
        Course {
          CourseInstructors(where: { userId: { _eq: $userId } }) {
            id
          }
        }
      }
      ProjectMentors(where: { userId: { _eq: $userId } }) {
        id
      }
      ProjectAuthors(where: { userId: { _eq: $userId }, participationStatus: { _eq: ACCEPTED } }) {
        id
      }
    }
  }
`;

const GET_ACHIEVEMENT_RECORD_ACCESS = `
  query UploadAchievementRecordAccess($id: Int!, $userId: uuid!) {
    AchievementRecord_by_pk(id: $id) {
      AchievementRecordAuthors(where: { userId: { _eq: $userId } }) {
        id
      }
      AchievementOption {
        AchievementOptionMentors(where: { userId: { _eq: $userId } }) {
          id
        }
        AchievementOptionCourses {
          Course {
            CourseInstructors(where: { userId: { _eq: $userId } }) {
              id
            }
          }
        }
      }
    }
  }
`;

const GET_JOB_POSTING_ACCESS = `
  query UploadJobPostingAccess($id: Int!, $userId: uuid!) {
    JobPosting_by_pk(id: $id) {
      Organization {
        OrganizationAdmins(where: { userId: { _eq: $userId }, canManageJobs: { _eq: true } }) {
          id
        }
      }
    }
  }
`;

// Project authors may only change their project while it is still open.
const AUTHOR_EDITABLE_PROJECT_STATUSES = new Set(['PROPOSED', 'ONGOING']);

const RULES = {
  // public_User: a user updates their own row only.
  userid: async ({ id, userId }) => String(id) === userId,

  // public_Course: course instructors, and org admins whose grant covers the course.
  courseid: async ({ client, id, userId }) => {
    const result = await client.request(GET_COURSE_INSTRUCTOR, { id, userId });
    return result.CourseInstructor.length > 0 || isOrgAdminOfCourse(client, userId, id);
  },

  // public_Project: instructors of a linked course, mentors, accepted authors
  // of an open project, and org admins of a linked course.
  projectid: async ({ client, id, userId }) => {
    const project = (await client.request(GET_PROJECT_ACCESS, { id, userId })).Project_by_pk;
    if (!project) return false;
    if (project.ProjectMentors.length > 0) return true;
    if (project.ProjectCourses.some((link) => link.Course?.CourseInstructors.length > 0)) return true;
    if (project.ProjectAuthors.length > 0 && AUTHOR_EDITABLE_PROJECT_STATUSES.has(project.status)) return true;
    for (const link of project.ProjectCourses) {
      if (await isOrgAdminOfCourse(client, userId, link.courseId)) return true;
    }
    return false;
  },

  // public_AchievementRecord: its authors, the option's mentors and the
  // instructors of the option's courses.
  achievementRecordId: async ({ client, id, userId }) => {
    const record = (await client.request(GET_ACHIEVEMENT_RECORD_ACCESS, { id, userId })).AchievementRecord_by_pk;
    if (!record) return false;
    const option = record.AchievementOption;
    return (
      record.AchievementRecordAuthors.length > 0 ||
      (option?.AchievementOptionMentors.length ?? 0) > 0 ||
      (option?.AchievementOptionCourses ?? []).some((link) => link.Course?.CourseInstructors.length > 0)
    );
  },

  // public_JobPosting: admins of the posting's organization with canManageJobs.
  jobpostingid: async ({ client, id, userId }) => {
    const posting = (await client.request(GET_JOB_POSTING_ACCESS, { id, userId })).JobPosting_by_pk;
    return (posting?.Organization?.OrganizationAdmins.length ?? 0) > 0;
  },
};

/**
 * @param {Object} req - Hasura action request
 * @returns {Promise<{ authorized: boolean, reason?: string }>}
 */
export async function authorizeUpload(req) {
  const sessionVariables = req.body?.session_variables || {};
  if (sessionVariables['x-hasura-role'] === ADMIN_ROLE) {
    return { authorized: true };
  }

  const userId = sessionVariables['x-hasura-user-id'];
  if (!userId) {
    return { authorized: false, reason: 'User ID missing from session' };
  }

  // Everything but the payload and the file name identifies the target. An
  // input without a rule here belongs to an admin-only action, so it is denied.
  const { base64file: _base64file, filename: _filename, ...targets } = req.body?.input || {};
  const keys = Object.keys(targets);
  if (keys.length !== 1 || !RULES[keys[0]]) {
    return { authorized: false, reason: 'No upload rule for this target' };
  }

  const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
  });
  const authorized = await RULES[keys[0]]({ client, id: targets[keys[0]], userId });
  return authorized ? { authorized: true } : { authorized: false, reason: `Not allowed to upload for ${keys[0]}` };
}
