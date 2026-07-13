import { GraphQLClient, gql } from 'graphql-request';

/**
 * Employer-facing archive action for StuJo job postings. JobPosting.status
 * is server-controlled (Hasura permissions exclude it from org-admin
 * updates), so taking a posting offline goes through this action.
 * Only PUBLISHED or EXPIRED postings can be archived; authorization
 * mirrors publishJobPosting (canManageJobs on the posting's organization).
 */

const GET_POSTING = gql`
  query GetJobPostingForArchive($id: Int!) {
    JobPosting_by_pk(id: $id) {
      id
      status
      Organization {
        OrganizationAdmins {
          userId
          canManageJobs
        }
      }
    }
  }
`;

const ARCHIVE_POSTING = gql`
  mutation ArchiveJobPosting($id: Int!) {
    update_JobPosting_by_pk(pk_columns: { id: $id }, _set: { status: ARCHIVED }) {
      id
      status
    }
  }
`;

export default async function archiveJobPosting(req, logger) {
  logger.info('########## Archive Job Posting ##########');

  try {
    const sessionUserId = req.body?.session_variables?.['x-hasura-user-id'];
    const sessionRole = req.body?.session_variables?.['x-hasura-role'];
    const { jobPostingId } = req.body.input || req.body;

    if (!jobPostingId) {
      return { success: false, error: 'jobPostingId is required', messageKey: 'MISSING_JOB_POSTING_ID' };
    }
    if (!sessionUserId) {
      return { success: false, error: 'Missing authenticated session user', messageKey: 'UNAUTHORIZED' };
    }

    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
    });

    const data = await client.request(GET_POSTING, { id: jobPostingId });
    const posting = data.JobPosting_by_pk;
    if (!posting) {
      return { success: false, error: 'Job posting not found', messageKey: 'JOB_POSTING_NOT_FOUND' };
    }

    const isAdmin = sessionRole === 'admin';
    const hasGrant = posting.Organization?.OrganizationAdmins?.some(
      (grant) => String(grant.userId) === String(sessionUserId) && grant.canManageJobs === true
    );
    if (!isAdmin && !hasGrant) {
      return { success: false, error: 'Not authorized to archive this posting', messageKey: 'UNAUTHORIZED' };
    }

    if (!['PUBLISHED', 'EXPIRED'].includes(posting.status)) {
      return {
        success: false,
        error: `Posting in status ${posting.status} cannot be archived`,
        messageKey: 'INVALID_STATUS',
      };
    }

    await client.request(ARCHIVE_POSTING, { id: jobPostingId });
    return { success: true };
  } catch (error) {
    logger.error('Error in archiveJobPosting', { error: error.message, stack: error.stack });
    return { success: false, error: error.message || 'Internal server error', messageKey: 'ARCHIVE_JOB_POSTING_ERROR' };
  }
}
