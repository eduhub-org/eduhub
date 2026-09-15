import { gql } from 'graphql-request';

/**
 * Authorization for changes to organization-admin-gated Organization columns
 * (logo, website, ...).
 *
 * Shared by every handler that needs the caller's own GraphQL client so it
 * can persist the column itself (a StuJo request's role is `user`, which has
 * no Hasura update permission on Organization at all — the write has to
 * happen in the handler, not via a follow-up client mutation).
 *
 * The rule: a settings admin (canManageSettings) may always change it. An org
 * admin with only the job-offer capability (canManageJobs) may change it too,
 * but only while their organization has no settings admin of its own — once
 * one exists, the field, like every other settings-gated column, is theirs to
 * own. This lets a StuJo-only employer (whose claim grants canManageJobs, not
 * canManageSettings — see the rework_organization_admin_bootstrap migration)
 * maintain their job board profile without being blocked on nobody having
 * ever claimed the broader settings role for their organization.
 */

const GET_ORGANIZATION_ADMIN_GRANT = gql`
  query GetOrganizationAdminGrant($organizationId: Int!, $userId: uuid!) {
    ownGrant: OrganizationAdmin(
      where: { organizationId: { _eq: $organizationId }, userId: { _eq: $userId } }
      limit: 1
    ) {
      id
      canManageSettings
      canManageJobs
    }
    settingsAdmins: OrganizationAdmin_aggregate(
      where: { organizationId: { _eq: $organizationId }, canManageSettings: { _eq: true } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

/**
 * @param {import('graphql-request').GraphQLClient} client - must carry the admin secret; the
 *   settings-admin count needs to see every grant of the organization, not just the caller's own.
 * @param {{ sessionUserId: string | undefined, sessionRole: string | undefined, organizationId: number }} params
 * @returns {Promise<{ authorized: true } | { authorized: false, reason: string }>}
 */
export async function authorizeOrganizationAdminFieldChange(client, { sessionUserId, sessionRole, organizationId }) {
  if (sessionRole === 'admin') {
    return { authorized: true };
  }

  if (!sessionUserId) {
    return { authorized: false, reason: 'Missing authenticated session user' };
  }

  const data = await client.request(GET_ORGANIZATION_ADMIN_GRANT, {
    organizationId,
    userId: sessionUserId,
  });

  const grant = data?.ownGrant?.[0];
  if (grant?.canManageSettings) {
    return { authorized: true };
  }

  const settingsAdminCount = data?.settingsAdmins?.aggregate?.count ?? 0;
  if (grant?.canManageJobs && settingsAdminCount === 0) {
    return { authorized: true };
  }

  return { authorized: false, reason: "Not authorized to change this organization's data" };
}
