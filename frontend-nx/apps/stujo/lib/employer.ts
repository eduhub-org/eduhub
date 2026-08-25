import { gql } from '@apollo/client';

/**
 * GraphQL documents for the employer dashboard (Mein StuJo). All queries
 * and mutations run under the `org_admin` inherited role (pinned per
 * request via the Apollo context), which resolves to org_admin_access
 * permissions in Hasura.
 */

export const ORG_ADMIN_ROLE_CONTEXT = { role: 'org_admin' };

// The publish/archive actions are permitted for user_access (they authorize
// internally against OrganizationAdmin.canManageJobs), so they are called
// under the `user` role — action permissions don't resolve inherited roles.
export const ACTION_ROLE_CONTEXT = { role: 'user' };

export const MY_JOB_ORGANIZATIONS = gql`
  query MyJobOrganizations {
    OrganizationAdmin(where: { canManageJobs: { _eq: true } }) {
      id
      organizationId
      Organization {
        id
        name
        JobPostingCredits {
          id
          remaining
          unlimited
          jobPostingType
        }
      }
    }
  }
`;

export const MY_JOB_POSTINGS = gql`
  query MyJobPostings($organizationId: Int!) {
    JobPosting(
      where: { organizationId: { _eq: $organizationId } }
      order_by: [{ status: asc }, { publishedAt: desc_nulls_last }, { created_at: desc }]
    ) {
      id
      title
      type
      status
      featured
      views
      publishedAt
      expiresAt
      created_at
    }
    JobPostingPrice {
      jobPostingType
      price
      currency
      vatRate
      durationDays
    }
  }
`;

export const CREATE_JOB_POSTING = gql`
  mutation CreateJobPosting($object: JobPosting_insert_input!) {
    insert_JobPosting_one(object: $object) {
      id
    }
  }
`;

export const UPDATE_JOB_POSTING = gql`
  mutation UpdateJobPosting($id: Int!, $set: JobPosting_set_input!) {
    update_JobPosting_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
    }
  }
`;

export const GET_JOB_POSTING_FOR_EDIT = gql`
  query GetJobPostingForEdit($id: Int!) {
    JobPosting_by_pk(id: $id) {
      id
      organizationId
      title
      type
      status
      region
      occupation
      description
      shortDescription
      requirement
      location
      salaryText
      startText
      durationText
      applicationDeadline
      hoursPerWeek
      language
      pdfUrl
    }
  }
`;

export const SAVE_JOB_POSTING_PDF = gql`
  mutation SaveJobPostingPdf($base64file: String!, $filename: String!, $jobpostingid: Int!) {
    saveJobPostingPdf(base64file: $base64file, filename: $filename, jobpostingid: $jobpostingid) {
      success
      error
      messageKey
      filePath
      accessUrl
    }
  }
`;

export const DELETE_DRAFT_POSTING = gql`
  mutation DeleteDraftJobPosting($id: Int!) {
    delete_JobPosting_by_pk(id: $id) {
      id
    }
  }
`;

export const PUBLISH_JOB_POSTING_ACTION = gql`
  mutation PublishJobPostingAction($jobPostingId: Int!) {
    publishJobPosting(jobPostingId: $jobPostingId) {
      success
      published
      checkoutUrl
      expiresAt
      usedCredit
      error
      messageKey
    }
  }
`;

export const ARCHIVE_JOB_POSTING_ACTION = gql`
  mutation ArchiveJobPostingAction($jobPostingId: Int!) {
    archiveJobPosting(jobPostingId: $jobPostingId) {
      success
      error
      messageKey
    }
  }
`;

export const ENUM_OPTIONS = gql`
  query JobEnumOptions {
    JobPostingType {
      value
    }
    JobRegion {
      value
    }
    JobOccupation {
      value
    }
  }
`;
