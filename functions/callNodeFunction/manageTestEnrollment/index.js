import { GraphQLClient } from "graphql-request";

/**
 * Create or remove a preview enrollment.
 *
 * The participant view of a course is enforced server-side: the CourseParticipant
 * view, the session online links and the whole project flow all require the
 * requesting user to hold a CONFIRMED enrollment. So the only way to show an
 * instructor what their participants see is to give them a real enrollment, and
 * mark it `isTest` so nothing else in the system treats it as participation
 * (see migration 1789646311423 and the guards in sendEnrollmentEmail /
 * add_confirmed_user_to_mm).
 *
 * This lives in an action rather than in Hasura permissions on CourseEnrollment
 * deliberately. `instructor` is an inherited role (instructor_access +
 * user_access + anonymous) and Hasura cannot merge an insert permission the two
 * parents define differently, so adding one would force an explicit
 * `- role: instructor` rule that overrides the merge - and that rule would then
 * govern the existing "add participants" flow, which inserts enrollments for
 * *other* users. See the note at the top of inherited_roles.yaml.
 */

const ROLES_ALLOWED_WITHOUT_INSTRUCTORSHIP = new Set(["admin"]);
// Mirrors the action's `permissions: - role: instructor_access` plus admin, which
// bypasses action permissions. Org admins are not listed because they cannot
// reach the manage-course screen in the first place (see the guard in
// ManageCourseContent) - add them here and to actions.yaml together, or not at all.
const ROLES_ALLOWED = new Set(["admin", "instructor", "instructor_access"]);
// Ending a preview is also open to plain users (actions.yaml grants
// removeTestEnrollment to user_access too): whoever lost the instructor role
// while previewing must still be able to end it. The handler only ever removes
// the caller's own `isTest` row, so this reaches nothing else.
const ROLES_ALLOWED_TO_REMOVE = new Set([...ROLES_ALLOWED, "user", "user_access"]);

const ensureHasuraClient = () => {
  if (!process.env.HASURA_ENDPOINT || !process.env.HASURA_ADMIN_SECRET) {
    throw new Error("HASURA_ENDPOINT or HASURA_ADMIN_SECRET not configured");
  }
  return new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: {
      "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
    },
  });
};

const GET_CONTEXT = `
  query TestEnrollmentContext($courseId: Int!, $userId: uuid!) {
    Course_by_pk(id: $courseId) {
      id
      CourseInstructors(where: { userId: { _eq: $userId } }) {
        id
      }
    }
    CourseEnrollment(
      where: { courseId: { _eq: $courseId }, userId: { _eq: $userId } }
      limit: 1
    ) {
      id
      isTest
      status
      created_at
    }
  }
`;

const INSERT_TEST_ENROLLMENT = `
  mutation InsertTestEnrollment($courseId: Int!, $userId: uuid!) {
    insert_CourseEnrollment_one(
      object: {
        courseId: $courseId
        userId: $userId
        status: CONFIRMED
        isTest: true
        motivationLetter: "Preview enrollment"
      }
    ) {
      id
    }
  }
`;

/**
 * What a preview may have authored. Removing the enrollment without this leaves
 * a project standing in the course showcase, visible to real participants, with
 * no participation behind it.
 *
 * Bounded by when the preview began ($since). Nothing ties an authorship to an
 * enrollment, so without that bound this would also collect work the user
 * authored in this course before ever previewing it -- and the sole-author rule
 * below would then delete the project outright. An authorship needs no
 * enrollment behind it (a co-author added to someone else's project has one,
 * as does anyone whose enrollment was later removed), so that is reachable.
 */
const GET_PREVIEW_ARTEFACTS = `
  query TestEnrollmentArtefacts($courseId: Int!, $userId: uuid!, $since: timestamptz!) {
    ProjectAuthor(
      where: {
        userId: { _eq: $userId }
        created_at: { _gte: $since }
        Project: { ProjectCourses: { courseId: { _eq: $courseId } } }
      }
    ) {
      id
      projectId
      Project {
        id
        created_at
        ProjectAuthors {
          id
          userId
        }
      }
    }
    Session(where: { courseId: { _eq: $courseId } }) {
      id
    }
  }
`;

const DELETE_PREVIEW = `
  mutation DeleteTestEnrollment(
    $enrollmentId: Int!
    $authorIds: [Int!]!
    $projectIds: [Int!]!
    $sessionIds: [Int!]!
    $userId: uuid!
    $since: timestamptz!
  ) {
    delete_ProjectAuthor(where: { id: { _in: $authorIds } }) {
      affected_rows
    }
    delete_Project(where: { id: { _in: $projectIds } }) {
      affected_rows
    }
    delete_Attendance(
      where: {
        userId: { _eq: $userId }
        sessionId: { _in: $sessionIds }
        created_at: { _gte: $since }
      }
    ) {
      affected_rows
    }
    delete_CourseEnrollment_by_pk(id: $enrollmentId) {
      id
    }
  }
`;

const unauthorized = (error) => ({
  success: false,
  messageKey: "TEST_ENROLLMENT_UNAUTHORIZED",
  error,
});

export default async function manageTestEnrollment(req, logger) {
  logger.info("########## Manage Test Enrollment ##########");

  const operation = req.headers.operation;
  if (operation !== "create" && operation !== "remove") {
    return {
      success: false,
      messageKey: "TEST_ENROLLMENT_INVALID_INPUT",
      error: "operation header must be 'create' or 'remove'",
    };
  }

  const role = req.body?.session_variables?.["x-hasura-role"];
  const allowedRoles = operation === "remove" ? ROLES_ALLOWED_TO_REMOVE : ROLES_ALLOWED;
  if (!allowedRoles.has(role)) {
    return unauthorized("Insufficient permissions to manage a preview enrollment");
  }

  const userId = req.body?.session_variables?.["x-hasura-user-id"];
  if (!userId) {
    return unauthorized("User ID missing from session");
  }

  const courseId = Number(req.body?.input?.courseId);
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return {
      success: false,
      messageKey: "TEST_ENROLLMENT_INVALID_INPUT",
      error: "courseId must be a positive integer",
    };
  }

  const client = ensureHasuraClient();
  const context = await client.request(GET_CONTEXT, { courseId, userId });

  if (!context.Course_by_pk) {
    return {
      success: false,
      messageKey: "TEST_ENROLLMENT_COURSE_NOT_FOUND",
      error: `Course ${courseId} does not exist`,
    };
  }

  const existing = context.CourseEnrollment[0] ?? null;

  // A super-admin may preview any course; everyone else only one they instruct.
  // Ending one's own preview needs no instructorship: someone removed from the
  // course while previewing it would otherwise keep a hidden CONFIRMED
  // enrollment -- and the participant surface with it -- that nothing can end.
  // The row is scoped to the caller's own userId above and must be `isTest`
  // (checked below), so this can only ever remove their own preview.
  const instructsCourse = context.Course_by_pk.CourseInstructors.length > 0;
  const endingOwnPreview = operation === "remove" && existing?.isTest === true;
  if (!instructsCourse && !endingOwnPreview && !ROLES_ALLOWED_WITHOUT_INSTRUCTORSHIP.has(role)) {
    return unauthorized("Only an instructor of this course may preview it");
  }

  if (operation === "create") {
    if (existing && !existing.isTest) {
      // They take part for real. Overwriting that row would rewrite a real
      // participation, and there is nothing to preview anyway.
      return {
        success: false,
        messageKey: "TEST_ENROLLMENT_ALREADY_PARTICIPANT",
        error: "You already have a real enrollment in this course",
      };
    }
    if (existing) {
      return {
        success: true,
        messageKey: "TEST_ENROLLMENT_CREATED",
        enrollmentId: existing.id,
      };
    }

    const inserted = await client.request(INSERT_TEST_ENROLLMENT, { courseId, userId });
    logger.info("Created preview enrollment", {
      courseId,
      enrollmentId: inserted.insert_CourseEnrollment_one.id,
    });
    return {
      success: true,
      messageKey: "TEST_ENROLLMENT_CREATED",
      enrollmentId: inserted.insert_CourseEnrollment_one.id,
    };
  }

  if (!existing) {
    return { success: true, messageKey: "TEST_ENROLLMENT_REMOVED", enrollmentId: null };
  }
  if (!existing.isTest) {
    return unauthorized("This is a real enrollment and is not removable here");
  }

  // Everything removed below is bounded by this: the moment the preview began.
  const since = existing.created_at;
  const artefacts = await client.request(GET_PREVIEW_ARTEFACTS, { courseId, userId, since });
  const authorIds = artefacts.ProjectAuthor.map((author) => author.id);
  // Only projects the preview itself brought into being: the preview must be
  // their sole author, and they must not have existed before the preview did.
  //
  // The second half is what the `since` bound on the authorship cannot say on
  // its own. An authorship acquired during the preview window through some
  // other path -- a super-admin adding themselves to an existing project, say
  // -- is still dropped, but the project behind it predates the preview and is
  // nobody's to delete here.
  const sinceMs = new Date(since).getTime();
  const projectIds = artefacts.ProjectAuthor.filter(
    (author) =>
      author.Project.ProjectAuthors.every((other) => other.userId === userId) &&
      new Date(author.Project.created_at).getTime() >= sinceMs
  ).map((author) => author.projectId);
  const sessionIds = artefacts.Session.map((session) => session.id);

  await client.request(DELETE_PREVIEW, {
    enrollmentId: existing.id,
    authorIds,
    projectIds,
    sessionIds,
    userId,
    since,
  });

  logger.info("Removed preview enrollment", {
    courseId,
    enrollmentId: existing.id,
    removedProjects: projectIds.length,
  });

  return {
    success: true,
    messageKey: "TEST_ENROLLMENT_REMOVED",
    enrollmentId: existing.id,
  };
}
