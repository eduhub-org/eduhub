import { gql } from 'graphql-request';
import { createCancellationRequestVariableReplacer } from '../emailTemplateVariables.js';
import { queueEmail } from '../lib/queueEmail.js';
import { collectOrganizerRecipients } from '../sendCancellationRequestEmail/index.js';

const GET_DECLINE_DETAILS = gql`
  query GetInvitationDeclineDetails($enrollmentId: Int!) {
    CourseEnrollment_by_pk(id: $enrollmentId) {
      id
      User {
        id
        firstName
        lastName
        email
      }
      Course {
        id
        title
        CourseInstructors {
          User {
            id
            firstName
            lastName
            email
          }
        }
        Program {
          type
          Organization {
            OrganizationAdmins {
              canManageCourses
              canManageEvents
              canManageDegrees
              canManageSettings
              User {
                id
                firstName
                lastName
                email
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * A participant declined their invitation themselves (INVITED -> CANCELLED by
 * their own session). Its place is free again, so the organizers are told and
 * can invite the next person from the waitlist. An organizer cancelling an
 * invitation knows already and is not mailed.
 */
export const isDeclinedByParticipant = (event) =>
  event?.op === 'UPDATE' &&
  event.data?.old?.status === 'INVITED' &&
  event.data?.new?.status === 'CANCELLED' &&
  !!event.session_variables?.['x-hasura-user-id'] &&
  String(event.session_variables['x-hasura-user-id']).toLowerCase() ===
    String(event.data.new.userId ?? '').toLowerCase();

/** Queues INVITATION_DECLINED_ORGANIZER to every organizer of the course. Never throws. */
export async function notifyOrganizersOfDecline(enrollmentId, client, logger) {
  try {
    const result = await client.request(GET_DECLINE_DETAILS, { enrollmentId });
    const enrollment = result?.CourseEnrollment_by_pk;
    if (!enrollment) return;
    const { User: participant, Course: course } = enrollment;
    const frontendUrl = process.env.FRONTEND_URL || 'https://edu.opencampus.sh';
    const decline = {
      participantName: [participant?.firstName, participant?.lastName].filter(Boolean).join(' '),
      participantEmail: participant?.email || '',
      requestedAt: new Date().toISOString(),
      reason: '',
      manageLink: `${frontendUrl}/manage/course/${course.id}`,
    };
    const formatDate = (value) => new Date(value).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' });

    for (const organizer of collectOrganizerRecipients(course, participant?.id)) {
      const mailResult = await queueEmail({
        templateType: 'INVITATION_DECLINED_ORGANIZER',
        variableReplacer: createCancellationRequestVariableReplacer(organizer, course, decline, formatDate),
        recipientEmail: organizer.email,
        courseId: course.id,
        client,
        logger,
      });
      if (!mailResult.success) {
        logger.error('Failed to queue invitation declined email', {
          enrollmentId,
          recipientUserId: organizer.id,
          error: mailResult.error,
        });
      }
    }
  } catch (error) {
    logger.error(`Could not notify organizers of a declined invitation: ${error.message}`, { enrollmentId });
  }
}
