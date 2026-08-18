import { gql, GraphQLClient } from 'graphql-request';
import { queueEmail } from '../lib/queueEmail.js';
import { withRetry } from '../lib/withRetry.js';
import { createProjectVariableReplacer } from '../emailTemplateVariables.js';

/**
 * Sends project lifecycle emails.
 *
 * Wired to two Hasura event triggers:
 *   - send_project_author_email on public.ProjectAuthor (INSERT + UPDATE of participationStatus)
 *   - send_project_status_email on public.Project (UPDATE of status)
 *
 * The originating table is read from req.body.table.name so a single function
 * can serve both triggers.
 *
 * @param {Object} req - Request object from Hasura event trigger
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Response object
 */
export default async function sendProjectEmail(req, logger) {
  logger.info('########## Send Project Email ##########');
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    const { event, table } = req.body;
    const { op, data } = event;
    const tableName = table?.name;

    if (op !== 'INSERT' && op !== 'UPDATE') {
      return { success: true, messageKey: 'NO_ACTION_NEEDED', message: 'No action needed for this operation' };
    }

    // Decide the template, the affected project, and (for author events) the affected user.
    let projectId;
    let templateType;
    let recipientSelector; // 'authors' | 'staff' | 'staff_and_authors' | 'affected_user'
    let affectedUserId = null;
    let applicantUserId = null;

    if (tableName === 'ProjectAuthor') {
      const authorNew = data.new;
      const authorOld = data.old;
      projectId = authorNew.projectId;
      const status = authorNew.participationStatus;

      if (op === 'INSERT' && status === 'REQUESTED') {
        templateType = 'PROJECT_JOIN_REQUESTED';
        recipientSelector = 'staff_and_owner';
        applicantUserId = authorNew.userId;
      } else if (op === 'UPDATE' && authorOld?.participationStatus !== status) {
        affectedUserId = authorNew.userId;
        recipientSelector = 'affected_user';
        if (status === 'ACCEPTED') templateType = 'PROJECT_JOIN_ACCEPTED';
        else if (status === 'DECLINED') templateType = 'PROJECT_JOIN_DECLINED';
        else if (status === 'EXCLUDED') templateType = 'PROJECT_AUTHOR_EXCLUDED';
        else return { success: true, messageKey: 'NO_TEMPLATE_FOR_STATUS', message: `No email for participationStatus: ${status}` };
      } else {
        return { success: true, messageKey: 'NO_ACTION_NEEDED', message: 'No project author email for this change' };
      }
    } else if (tableName === 'Project') {
      const projectNew = data.new;
      const projectOld = data.old;
      if (op !== 'UPDATE' || projectNew.status === projectOld?.status) {
        return { success: true, messageKey: 'NO_ACTION_NEEDED', message: 'Project status unchanged' };
      }
      projectId = projectNew.id;
      switch (projectNew.status) {
        case 'ONGOING':
          // Distinguish first confirmation vs. a send-back after review.
          if (projectOld?.status === 'SUBMITTED') {
            templateType = 'PROJECT_SENT_BACK';
          } else {
            templateType = 'PROJECT_TEAM_CONFIRMED';
          }
          recipientSelector = 'authors';
          break;
        case 'SUBMITTED':
          templateType = 'PROJECT_SUBMITTED';
          recipientSelector = 'staff_and_authors';
          break;
        case 'COMPLETED':
          templateType = 'PROJECT_APPROVED';
          recipientSelector = 'authors';
          break;
        case 'INCOMPLETE':
          templateType = 'PROJECT_REJECTED';
          recipientSelector = 'authors';
          break;
        default:
          // No email for PROPOSED / PUBLISHED / other transitions.
          return { success: true, messageKey: 'NO_TEMPLATE_FOR_STATUS', message: `No email for project status: ${projectNew.status}` };
      }
    } else {
      return { success: true, messageKey: 'NO_ACTION_NEEDED', message: `Unhandled table: ${tableName}` };
    }

    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
    });

    // Load the project with everyone potentially involved.
    const GET_PROJECT = gql`
      query GetProjectForEmail($projectId: Int!) {
        Project_by_pk(id: $projectId) {
          id
          title
          proposedByUserId
          ProposedByUser { id email firstName lastName }
          ProjectAuthors {
            participationStatus
            User { id email firstName lastName }
          }
          ProjectCourses {
            Course { id CourseInstructors { User { id email firstName lastName } } }
          }
          ProjectMentors { User { id email firstName lastName } }
        }
      }
    `;

    const projectData = await withRetry(() => client.request(GET_PROJECT, { projectId }), {
      logger,
      description: `project ${projectId} lookup`,
    });
    const project = projectData?.Project_by_pk;
    if (!project) {
      logger.error(`Project not found: ${projectId}`);
      return { success: false, error: 'Project not found', messageKey: 'PROJECT_NOT_FOUND' };
    }

    const acceptedAuthors = (project.ProjectAuthors || [])
      .filter((a) => a.participationStatus === 'ACCEPTED')
      .map((a) => a.User)
      .filter(Boolean);
    const staff = [
      ...(project.ProjectCourses || []).flatMap((pc) => (pc.Course?.CourseInstructors || []).map((ci) => ci.User)),
      ...(project.ProjectMentors || []).map((m) => m.User),
    ].filter(Boolean);

    // Resolve recipients based on the selector.
    let recipients = [];
    switch (recipientSelector) {
      case 'authors':
        recipients = acceptedAuthors;
        break;
      case 'staff_and_authors':
        recipients = [...staff, ...acceptedAuthors];
        break;
      case 'staff_and_owner':
        recipients = [...staff];
        if (project.ProposedByUser) recipients.push(project.ProposedByUser);
        // fall back to accepted authors if there is no explicit owner
        if (!project.ProposedByUser) recipients.push(...acceptedAuthors);
        break;
      case 'affected_user': {
        const affected = (project.ProjectAuthors || []).map((a) => a.User).find((u) => u && u.id === affectedUserId);
        if (affected) recipients = [affected];
        break;
      }
      default:
        recipients = [];
    }

    // The applicant's display name for join-request emails.
    let applicantName = '';
    if (applicantUserId) {
      const applicant = (project.ProjectAuthors || []).map((a) => a.User).find((u) => u && u.id === applicantUserId);
      if (applicant) applicantName = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim();
    }

    // Dedup recipients by email.
    const seen = new Set();
    const uniqueRecipients = recipients.filter((u) => {
      if (!u?.email || seen.has(u.email)) return false;
      seen.add(u.email);
      return true;
    });

    if (uniqueRecipients.length === 0) {
      logger.info(`No recipients for project ${projectId}, template ${templateType}`);
      return { success: true, messageKey: 'NO_RECIPIENTS', message: 'No recipients resolved' };
    }

    // Course id enables course-specific template overrides (falls back to default).
    const courseId = project.ProjectCourses?.[0]?.Course?.id ?? null;

    const results = [];
    for (const recipient of uniqueRecipients) {
      const replacer = createProjectVariableReplacer(project, recipient, { applicantName });
      const result = await queueEmail({
        templateType,
        variableReplacer: replacer,
        recipientEmail: recipient.email,
        courseId,
        client,
        logger,
      });
      results.push(result);
    }

    const queued = results.filter((r) => r?.success).length;
    logger.info(`Project email ${templateType} for project ${projectId}: queued ${queued}/${uniqueRecipients.length}`);

    return {
      success: true,
      messageKey: 'PROJECT_EMAILS_QUEUED',
      templateType,
      projectId,
      queued,
      total: uniqueRecipients.length,
    };
  } catch (error) {
    logger.error(`Error processing project email: ${error.message}`, { error });
    return { success: false, error: error.message, messageKey: 'PROJECT_EMAIL_PROCESSING_FAILED' };
  }
}
