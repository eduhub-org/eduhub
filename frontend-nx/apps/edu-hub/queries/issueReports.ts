import { gql } from '@apollo/client';

/** Bug reports and feature ideas sent through the Assistant (issue #2234); admins only. */

export const ISSUE_REPORT_LIST = gql`
  query IssueReportList(
    $limit: Int = 20
    $offset: Int = 0
    $filter: IssueReport_bool_exp = {}
    $order_by: [IssueReport_order_by!] = { created_at: desc }
  ) {
    IssueReport(limit: $limit, offset: $offset, where: $filter, order_by: $order_by) {
      id
      type
      title
      description
      route
      role
      locale
      status
      priority
      duplicateOfId
      publicNote
      githubIssueUrl
      closedAt
      created_at
      updated_at
      User {
        id
        firstName
        lastName
        email
      }
      peopleAffected
    }
    IssueReport_aggregate(where: $filter) {
      aggregate {
        count
      }
    }
  }
`;

export const UPDATE_ISSUE_REPORT_STATUS = gql`
  mutation UpdateIssueReportStatus($id: Int!, $value: IssueReportStatus_enum!) {
    update_IssueReport_by_pk(pk_columns: { id: $id }, _set: { status: $value }) {
      id
      status
      closedAt
    }
  }
`;

export const UPDATE_ISSUE_REPORT_PRIORITY = gql`
  mutation UpdateIssueReportPriority($id: Int!, $value: IssueReportPriority_enum) {
    update_IssueReport_by_pk(pk_columns: { id: $id }, _set: { priority: $value }) {
      id
      priority
    }
  }
`;

export const UPDATE_ISSUE_REPORT_DUPLICATE_OF = gql`
  mutation UpdateIssueReportDuplicateOf($id: Int!, $duplicateOfId: Int!) {
    update_IssueReport_by_pk(pk_columns: { id: $id }, _set: { status: DUPLICATE, duplicateOfId: $duplicateOfId }) {
      id
      status
      duplicateOfId
      closedAt
    }
  }
`;

export const UPDATE_ISSUE_REPORT_PUBLIC_NOTE = gql`
  mutation UpdateIssueReportPublicNote($itemId: Int!, $text: String) {
    update_IssueReport_by_pk(pk_columns: { id: $itemId }, _set: { publicNote: $text }) {
      id
      publicNote
    }
  }
`;

export const UPDATE_ISSUE_REPORT_GITHUB_URL = gql`
  mutation UpdateIssueReportGithubUrl($itemId: Int!, $text: String) {
    update_IssueReport_by_pk(pk_columns: { id: $itemId }, _set: { githubIssueUrl: $text }) {
      id
      githubIssueUrl
    }
  }
`;

export const ISSUE_REPORT_SUMMARIES = gql`
  query IssueReportSummaries {
    IssueReportSummary(order_by: { created_at: desc }, limit: 12) {
      id
      periodStart
      periodEnd
      summary
      reportCount
      feedbackCount
      model
      costEur
      created_at
    }
  }
`;
