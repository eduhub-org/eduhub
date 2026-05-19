import { GraphQLClient } from "graphql-request";

const ALLOWED_ROLES = new Set(["admin", "user_access", "user", "instructor_access", "instructor"]);

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

const GET_TEMPLATE = `
  query GetProjectTemplate($parentProjectId: Int!) {
    Project_by_pk(id: $parentProjectId) {
      id
      title
      tagline
      description
      coverImageUrl
      type
      documentationInstructionId
      achievementCertificateType
      organizationId
      proposedByUserId
      status
      ProjectAuthors(where: { participationStatus: { _eq: ACCEPTED } }) {
        id
      }
      ProjectMentors {
        userId
      }
    }
  }
`;

const GET_COURSE_ENROLLMENT = `
  query GetCourseEnrollment($courseId: Int!, $userId: uuid!) {
    CourseEnrollment(
      where: {
        courseId: { _eq: $courseId }
        User: { id: { _eq: $userId } }
      }
    ) {
      id
    }
  }
`;

const INSERT_COPY = `
  mutation InsertProjectCopy(
    $title: String!
    $tagline: String
    $description: String
    $coverImageUrl: String
    $type: String
    $documentationInstructionId: Int
    $achievementCertificateType: ProjectAchievementCertificateType_enum
    $organizationId: Int
    $proposedByUserId: uuid!
    $parentProjectId: Int!
    $authorUserId: uuid!
    $courseId: Int!
    $mentorRows: [ProjectMentor_insert_input!]!
    $status: ProjectStatus_enum!
    $acceptingParticipants: Boolean!
  ) {
    insert_Project_one(
      object: {
        title: $title
        tagline: $tagline
        description: $description
        coverImageUrl: $coverImageUrl
        type: $type
        documentationInstructionId: $documentationInstructionId
        achievementCertificateType: $achievementCertificateType
        organizationId: $organizationId
        proposedByUserId: $proposedByUserId
        parentProjectId: $parentProjectId
        status: $status
        acceptingParticipants: $acceptingParticipants
        ProjectAuthors: {
          data: {
            userId: $authorUserId
            participationStatus: ACCEPTED
          }
        }
        ProjectCourses: {
          data: { courseId: $courseId }
        }
        ProjectMentors: {
          data: $mentorRows
        }
      }
    ) {
      id
    }
  }
`;

export default async function copyProjectFromTemplate(req, logger) {
  logger.info("########## Copy Project From Template ##########");

  const role = req.body?.session_variables?.["x-hasura-role"];
  if (!ALLOWED_ROLES.has(role)) {
    return {
      success: false,
      messageKey: "COPY_PROJECT_UNAUTHORIZED",
      error: "Insufficient permissions to copy project template",
    };
  }

  const userId = req.body?.session_variables?.["x-hasura-user-id"];
  if (!userId) {
    return {
      success: false,
      messageKey: "COPY_PROJECT_UNAUTHORIZED",
      error: "User ID missing from session",
    };
  }

  const input = req.body?.input || {};
  const parentProjectId = Number(input.parentProjectId);
  const courseId = Number(input.courseId);

  if (!Number.isInteger(parentProjectId) || parentProjectId <= 0) {
    return {
      success: false,
      messageKey: "COPY_PROJECT_INVALID_INPUT",
      error: "parentProjectId must be a positive integer",
    };
  }
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return {
      success: false,
      messageKey: "COPY_PROJECT_INVALID_INPUT",
      error: "courseId must be a positive integer",
    };
  }

  let hasuraClient;
  try {
    hasuraClient = ensureHasuraClient();
  } catch (error) {
    logger.error("Hasura client misconfigured", { error: error.message });
    return {
      success: false,
      messageKey: "SERVER_MISCONFIGURED",
      error: error.message,
    };
  }

  const isAdminCall = role === "admin";

  if (!isAdminCall) {
    try {
      const enrollmentResult = await hasuraClient.request({
        document: GET_COURSE_ENROLLMENT,
        variables: { courseId, userId },
      });
      if (!enrollmentResult?.CourseEnrollment?.length) {
        return {
          success: false,
          messageKey: "COPY_PROJECT_NOT_ENROLLED",
          error: "You must be enrolled in the target course to claim a template",
        };
      }
    } catch (error) {
      logger.error("Failed to verify course enrollment", { error: error.message });
      return {
        success: false,
        messageKey: "COPY_PROJECT_LOOKUP_FAILED",
        error: "Could not verify course enrollment",
      };
    }
  }

  let parent;
  try {
    const templateResult = await hasuraClient.request({
      document: GET_TEMPLATE,
      variables: { parentProjectId },
    });
    parent = templateResult?.Project_by_pk;
  } catch (error) {
    logger.error("Failed to load template project", { error: error.message });
    return {
      success: false,
      messageKey: "COPY_PROJECT_LOOKUP_FAILED",
      error: "Could not load the project template",
    };
  }

  if (!parent) {
    return {
      success: false,
      messageKey: "COPY_PROJECT_NOT_FOUND",
      error: "Template project not found",
    };
  }
  if (parent.status !== "PROPOSED") {
    return {
      success: false,
      messageKey: "COPY_PROJECT_INVALID_STATE",
      error: "Only templates in PROPOSED status can be claimed",
    };
  }
  if ((parent.ProjectAuthors || []).length > 0) {
    return {
      success: false,
      messageKey: "COPY_PROJECT_ALREADY_CLAIMED",
      error: "This template already has accepted authors",
    };
  }

  const mentorRows = (parent.ProjectMentors || []).map((mentor) => ({
    userId: mentor.userId,
  }));

  const isOnlineCourseTemplate = parent.type === "ONLINE_COURSE";
  const copyStatus = isOnlineCourseTemplate ? "ONGOING" : "PROPOSED";
  const copyAcceptingParticipants = !isOnlineCourseTemplate;

  try {
    const insertResult = await hasuraClient.request({
      document: INSERT_COPY,
      variables: {
        title: parent.title,
        tagline: parent.tagline ?? null,
        description: parent.description ?? null,
        coverImageUrl: parent.coverImageUrl ?? null,
        type: parent.type ?? null,
        documentationInstructionId: parent.documentationInstructionId ?? null,
        achievementCertificateType: parent.achievementCertificateType ?? null,
        organizationId: parent.organizationId ?? null,
        proposedByUserId: parent.proposedByUserId,
        parentProjectId,
        authorUserId: userId,
        courseId,
        mentorRows,
        status: copyStatus,
        acceptingParticipants: copyAcceptingParticipants,
      },
    });

    const newProjectId = insertResult?.insert_Project_one?.id;
    if (!Number.isInteger(newProjectId)) {
      throw new Error("Hasura insert did not return a project id");
    }

    return {
      success: true,
      messageKey: "COPY_PROJECT_OK",
      projectId: newProjectId,
    };
  } catch (error) {
    logger.error("Failed to insert project copy", { error: error.message });
    return {
      success: false,
      messageKey: "COPY_PROJECT_INSERT_FAILED",
      error: error.message,
    };
  }
}
