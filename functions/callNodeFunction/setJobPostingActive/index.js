import { GraphQLClient, gql } from 'graphql-request';

/**
 * Employer-facing deactivate/reactivate action for StuJo job postings.
 * Unlike archiving, deactivation is reversible: a DEACTIVATED posting can be
 * switched back to PUBLISHED as long as its publication window (expiresAt,
 * set on publish) has not ended. The window keeps running while the posting
 * is deactivated, so neither publishedAt nor expiresAt is touched here and
 * reactivation is free. Once the window has ended the employer re-posts via
 * publishJobPosting instead.
 *
 * Authorization mirrors publishJobPosting and archiveJobPosting
 * (canManageJobs on the posting's organization, or the admin role).
 */

const GET_POSTING = gql`
  query GetJobPostingForSetActive($id: Int!) {
    JobPosting_by_pk(id: $id) {
      id
      status
      expiresAt
      Organization {
        OrganizationAdmins {
          userId
          canManageJobs
        }
      }
    }
  }
`;

// Conditional on status and expiresAt so a concurrent expire_job_postings run
// cannot be overwritten with a posting that is live past its window.
const SET_STATUS = gql`
  mutation SetJobPostingActive(
    $id: Int!
    $from: JobPostingStatus_enum!
    $to: JobPostingStatus_enum!
    $now: timestamptz!
  ) {
    update_JobPosting(
      where: { id: { _eq: $id }, status: { _eq: $from }, expiresAt: { _gt: $now } }
      _set: { status: $to }
    ) {
      affected_rows
    }
  }
`;

export default async function setJobPostingActive(req, logger) {
  logger.info('########## Set Job Posting Active ##########');

  try {
    const sessionUserId = req.body?.session_variables?.['x-hasura-user-id'];
    const sessionRole = req.body?.session_variables?.['x-hasura-role'];
    const { jobPostingId, active } = req.body.input || req.body;

    if (!jobPostingId) {
      return { success: false, error: 'jobPostingId is required', messageKey: 'MISSING_JOB_POSTING_ID' };
    }
    if (typeof active !== 'boolean') {
      return { success: false, error: 'active must be a boolean', messageKey: 'INVALID_INPUT' };
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
      return { success: false, error: 'Not authorized to change this posting', messageKey: 'UNAUTHORIZED' };
    }

    const from = active ? 'DEACTIVATED' : 'PUBLISHED';
    const to = active ? 'PUBLISHED' : 'DEACTIVATED';

    if (posting.status !== from) {
      return {
        success: false,
        error: `Posting in status ${posting.status} cannot be ${active ? 'reactivated' : 'deactivated'}`,
        messageKey: 'INVALID_STATUS',
      };
    }

    const now = new Date();
    if (!posting.expiresAt || new Date(posting.expiresAt) <= now) {
      return {
        success: false,
        error: 'The publication window of this posting has ended',
        messageKey: 'WINDOW_EXPIRED',
      };
    }

    const result = await client.request(SET_STATUS, {
      id: jobPostingId,
      from,
      to,
      now: now.toISOString(),
    });
    if (!result.update_JobPosting?.affected_rows) {
      // Status or window changed between the read and the update.
      return {
        success: false,
        error: 'The posting changed in the meantime, please reload',
        messageKey: 'STATUS_CHANGED',
      };
    }

    return { success: true, status: to };
  } catch (error) {
    logger.error('Error in setJobPostingActive', { error: error.message, stack: error.stack });
    return {
      success: false,
      error: error.message || 'Internal server error',
      messageKey: 'SET_JOB_POSTING_ACTIVE_ERROR',
    };
  }
}
