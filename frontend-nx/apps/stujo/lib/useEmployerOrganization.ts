import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useCallback, useMemo } from 'react';

import { useCurrentUserId } from '@eduhub/hooks/authentication';

import { MY_JOB_ORGANIZATIONS, useEmployerRoleContext } from './employer';

export type EmployerOrganization = {
  id: number;
  name: string;
  JobPostingCredits: Array<{ id: number; remaining: number; jobPostingType: string | null }>;
};

// Survives reloads that drop the query string (e.g. the Stripe return URL, which
// carries its own params). The `?org=` param still wins so shared links are stable.
const STORAGE_KEY = 'stujo.employerOrganizationId';

const parseId = (value: unknown): number | null => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const readStoredId = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    return parseId(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Private mode / blocked storage: fall back to the default organization.
    return null;
  }
};

const storeId = (id: number): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(id));
  } catch {
    // Non-fatal: the `?org=` param keeps the choice for this navigation.
  }
};

type EmployerOrganizationState = {
  organizations: EmployerOrganization[];
  organization: EmployerOrganization | null;
  loading: boolean;
  selectOrganization: (id: number) => void;
};

/**
 * The organizations the signed-in user may post jobs for, plus the one the
 * employer screens currently act on.
 *
 * A user can hold canManageJobs for several organizations; the dashboard used
 * to take `OrganizationAdmin[0]` from an unordered query, so the second one was
 * invisible and which one won could change between requests. Selection order is
 * `?org=` (shareable, survives shallow navigation) -> last choice in
 * localStorage -> the alphabetically first organization.
 */
export const useEmployerOrganization = (): EmployerOrganizationState => {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const employerRole = useEmployerRoleContext();
  const currentUserId = useCurrentUserId();

  const { data, loading } = useQuery(MY_JOB_ORGANIZATIONS, {
    context: employerRole,
    variables: { userId: currentUserId },
    skip: sessionStatus !== 'authenticated' || !currentUserId,
  });

  const organizations = useMemo<EmployerOrganization[]>(
    () =>
      (data?.OrganizationAdmin ?? [])
        .map((grant: { Organization: EmployerOrganization | null }) => grant.Organization)
        .filter((organization: EmployerOrganization | null): organization is EmployerOrganization =>
          Boolean(organization)
        ),
    [data]
  );

  const organization = useMemo<EmployerOrganization | null>(() => {
    if (organizations.length === 0) return null;
    const find = (id: number | null) =>
      id === null ? undefined : organizations.find((candidate) => candidate.id === id);
    // An unknown id (revoked grant, hand-edited link) falls through to the default
    // rather than showing an empty dashboard.
    return find(parseId(router.query.org)) ?? find(readStoredId()) ?? organizations[0];
  }, [organizations, router.query.org]);

  const selectOrganization = useCallback(
    (id: number) => {
      storeId(id);
      router.replace({ query: { ...router.query, org: String(id) } }, undefined, {
        shallow: true,
      });
    },
    [router]
  );

  return { organizations, organization, loading, selectOrganization };
};
