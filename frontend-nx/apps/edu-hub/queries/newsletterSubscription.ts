import { gql } from '@apollo/client';

export const ORGANIZATION_NEWSLETTER_SUBSCRIPTION_BY_PK = gql`
  query OrganizationNewsletterSubscriptionByPk($userId: uuid!, $organizationId: Int!) {
    OrganizationNewsletterSubscription_by_pk(userId: $userId, organizationId: $organizationId) {
      userId
      organizationId
      status
      source
      errorMessage
      lastSyncedAt
    }
  }
`;

export const UPSERT_ORGANIZATION_NEWSLETTER_SUBSCRIPTION = gql`
  mutation UpsertOrganizationNewsletterSubscription(
    $userId: uuid!
    $organizationId: Int!
    $status: String!
    $source: String!
  ) {
    insert_OrganizationNewsletterSubscription_one(
      object: {
        userId: $userId
        organizationId: $organizationId
        status: $status
        source: $source
      }
      on_conflict: {
        constraint: OrganizationNewsletterSubscription_pkey
        update_columns: [status, source]
      }
    ) {
      userId
      organizationId
      status
      source
      errorMessage
      lastSyncedAt
    }
  }
`;

export const MY_ORGANIZATION_NEWSLETTER_OPTIONS = gql`
  query MyOrganizationNewsletterOptions($userId: uuid!) {
    Program(
      distinct_on: organizationId
      where: {
        Courses: { CourseEnrollments: { userId: { _eq: $userId } } }
        Organization: {
          ghostNewsletterApiUrl: { _is_null: false, _neq: "" }
          ghostNewsletterApiKeyConfigured: { _eq: true }
          _or: [{ ghostNewsletterListId: { _is_null: false } }, { ghostNewsletterSlug: { _is_null: false } }]
        }
      }
      order_by: [{ organizationId: asc }]
    ) {
      organizationId
      Organization {
        id
        name
        newsletterDescription
        newsletterProvider
        ghostNewsletterLabel
        ghostNewsletterDoubleOptInEnabled
        ghostNewsletterListId
        ghostNewsletterSlug
        ghostNewsletterApiUrl
        ghostNewsletterApiKeyConfigured
      }
    }

    OrganizationNewsletterSubscription(where: { userId: { _eq: $userId } }, order_by: [{ organizationId: asc }]) {
      organizationId
      status
      source
      errorMessage
      lastSyncedAt
      Organization {
        id
        name
        newsletterDescription
        newsletterProvider
        ghostNewsletterLabel
        ghostNewsletterDoubleOptInEnabled
        ghostNewsletterListId
        ghostNewsletterSlug
        ghostNewsletterApiUrl
        ghostNewsletterApiKeyConfigured
      }
    }
  }
`;
