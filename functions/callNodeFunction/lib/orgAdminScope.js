/**
 * Whether an organization admin may manage a course: it belongs to a program of
 * an organization they administer, and their grant carries the capability for
 * that program type (canManageCourses / canManageEvents / canManageDegrees), or
 * canManageSettings for any type. The same rule as the Hasura org_admin_access
 * permissions and hooks/manageScope.ts in the frontend.
 *
 * For handlers that query with the admin secret and therefore have to check
 * authorization themselves.
 */

/** Request roles of an org admin, as session_variables carry them. */
export const ORG_ADMIN_ROLES = new Set(['org_admin', 'org_admin_access']);

const CAPABILITY_BY_PROGRAM_TYPE = {
  COURSES: 'canManageCourses',
  EVENTS: 'canManageEvents',
  DEGREES: 'canManageDegrees',
};

const GET_COURSE_ORG_ADMIN_GRANTS = `
  query GetCourseOrgAdminGrants($courseId: Int!, $userId: uuid!) {
    Course_by_pk(id: $courseId) {
      Program {
        type
        Organization {
          OrganizationAdmins(where: { userId: { _eq: $userId } }) {
            canManageCourses
            canManageEvents
            canManageDegrees
            canManageSettings
          }
        }
      }
    }
  }
`;

/** True when one of the user's grants on the course's organization covers its program type. */
export const grantsCoverProgram = (programType, grants) => {
  const capability = CAPABILITY_BY_PROGRAM_TYPE[programType];
  return (grants ?? []).some((grant) => grant.canManageSettings || (capability && grant[capability]));
};

/**
 * @param {import('graphql-request').GraphQLClient} client - admin-secret client
 * @param {string} userId
 * @param {number} courseId
 * @returns {Promise<boolean>}
 */
export async function isOrgAdminOfCourse(client, userId, courseId) {
  if (!userId || !courseId) return false;
  const result = await client.request(GET_COURSE_ORG_ADMIN_GRANTS, { courseId, userId });
  const program = result?.Course_by_pk?.Program;
  return grantsCoverProgram(program?.type, program?.Organization?.OrganizationAdmins);
}
