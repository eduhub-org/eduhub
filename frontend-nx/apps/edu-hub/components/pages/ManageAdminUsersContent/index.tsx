import { FC, useMemo, useCallback, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { DocumentNode } from 'graphql';
import { MdStar, MdWarningAmber } from 'react-icons/md';

import TableGrid from '../../common/TableGrid';
import TableGridDeleteButton from '../../common/TableGrid/components/TableGridDeleteButton';
import Loading from '../../common/Loading';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import CheckboxSelector from '../../inputs/CheckboxSelector';
import { Button } from '../../common/Button';

import { useAdminQuery, useManageQuery, useOrgAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  ADMIN_USER_LIST,
  DELETE_ORGANIZATION_ADMIN,
  MANAGEABLE_ORGANIZATIONS,
  ADMIN_GRANTS,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_EVENTS,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_COURSES,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_DEGREES,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_JOBS,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_SETTINGS,
  VERIFY_ORGANIZATION_ADMIN_CLAIM,
} from '../../../queries/organizationAdmin';
import { ORGANIZATION_OPTIONS } from '../../../queries/organization';
import { UPDATE_USER_ADMIN_STATUS, ADMIN_USERS } from '../../../queries/actions';
import { PageBlock } from '../../common/PageBlock';
import CommonPageHeader from '../../common/CommonPageHeader';
import { useIsAdmin, useManageRole } from '../../../hooks/authentication';
import { useUserId } from '../../../hooks/user';
import { AdminUserList_User_OrganizationAdmins } from '../../../queries/__generated__/AdminUserList';
import { OrganizationOptions, OrganizationOptionsVariables } from '../../../queries/__generated__/OrganizationOptions';
import {
  ManageableOrganizations,
  ManageableOrganizationsVariables,
} from '../../../queries/__generated__/ManageableOrganizations';
import { AdminGrants } from '../../../queries/__generated__/AdminGrants';
import { AdminUsers } from '../../../queries/__generated__/AdminUsers';
import {
  VerifyOrganizationAdminClaim,
  VerifyOrganizationAdminClaimVariables,
} from '../../../queries/__generated__/VerifyOrganizationAdminClaim';
import { User_bool_exp, order_by } from '../../../__generated__/globalTypes';
import AddAdminDialog, { AdminOrganizationOption } from './AddAdminDialog';
import { AdminAccessRow, claimNeedsReview, toAccessRows } from './accessRows';
import { ADMIN_PRIVILEGES, AdminPrivilege, buildPrivilegeCondition, privilegeLabelKey } from './adminPrivileges';

// Every mutation on a grant changes both the list (capabilities, and possibly whether the user is
// listed at all) and the per-organization settings-admin counts that gate the sole-admin guard.
const GRANT_REFETCH_QUERIES = ['AdminUserList', 'AdminGrants'];

/**
 * The capability flags of the row's organization grant, plus — where the row itself carries no
 * delete control — the control to revoke the grant.
 */
const OrganizationGrantBlock: FC<{
  grant: AdminUserList_User_OrganizationAdmins;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  // True when this grant is the only settings admin of its organization: the settings capability
  // must not be turned off (and the grant not deleted) here, because the DB guard would reject it —
  // unless the viewer is a super-admin, who bypasses the guard at the DB level.
  isSoleSettingsAdmin: boolean;
  // False when the table row's own delete control already revokes exactly this grant.
  showDelete: boolean;
}> = ({ grant, firstName, lastName, isAdmin, isSoleSettingsAdmin, showDelete }) => {
  const t = useTranslations('manageAdminUsers');
  // The time zone is pinned so the date does not shift near midnight, but the format follows the
  // reader's locale.
  const locale = useLocale();
  const manageRole = useManageRole();

  // Non-super-admins cannot clear the last settings admin of an org; super-admins bypass the guard.
  const settingsLocked = isSoleSettingsAdmin && !isAdmin;

  const needsReview = claimNeedsReview(grant);

  // Confirming a reviewed claim writes claimVerification, which no organization role may touch —
  // hence the admin-role mutation, and hence the button only for super-admins.
  const [verifyClaim, { loading: verifying }] = useAdminMutation<
    VerifyOrganizationAdminClaim,
    VerifyOrganizationAdminClaimVariables
  >(VERIFY_ORGANIZATION_ADMIN_CLAIM, { refetchQueries: GRANT_REFETCH_QUERIES });
  const [verifyFailed, setVerifyFailed] = useState(false);

  const handleVerifyClaim = useCallback(async () => {
    setVerifyFailed(false);
    try {
      const response = await verifyClaim({ variables: { id: grant.id } });
      // The mutation pins the unverified state, so zero rows means somebody else already reviewed
      // or revoked this grant. The refetch above brings the row up to date either way; all that is
      // left is to not claim success.
      if (!response.data?.update_OrganizationAdmin?.affected_rows) {
        setVerifyFailed(true);
      }
    } catch {
      setVerifyFailed(true);
    }
  }, [verifyClaim, grant.id]);

  const capabilities = useMemo<
    {
      key: string;
      label: string;
      checked: boolean;
      mutation: DocumentNode;
      disabled?: boolean;
      helpText?: string;
    }[]
  >(
    () => [
      {
        key: 'events',
        label: t('can_manage_events'),
        checked: grant.canManageEvents,
        mutation: UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_EVENTS,
      },
      {
        key: 'courses',
        label: t('can_manage_courses'),
        checked: grant.canManageCourses,
        mutation: UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_COURSES,
      },
      {
        key: 'degrees',
        label: t('can_manage_degrees'),
        checked: grant.canManageDegrees,
        mutation: UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_DEGREES,
      },
      {
        key: 'jobs',
        label: t('can_manage_jobs'),
        checked: grant.canManageJobs,
        mutation: UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_JOBS,
      },
      {
        key: 'settings',
        label: t('can_manage_users_and_settings'),
        checked: grant.canManageSettings,
        mutation: UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_SETTINGS,
        // Sole settings admin: block turning it off. Granting settings to a colleague first lifts
        // the lock, which is why every toggle also refetches the counts.
        disabled: settingsLocked,
        helpText: settingsLocked ? t('sole_settings_admin_hint') : undefined,
      },
    ],
    [grant, t, settingsLocked]
  );

  return (
    <div className="border border-solid border-border-primary rounded p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-sm font-semibold truncate">{grant.Organization.name}</div>
        {showDelete && (
          <TableGridDeleteButton
            deleteMutation={DELETE_ORGANIZATION_ADMIN}
            id={grant.id}
            idType="number"
            role={manageRole}
            disabled={settingsLocked}
            refetchQueries={GRANT_REFETCH_QUERIES}
            deletionConfirmationQuestion={t('deletion_confirmation_question', {
              firstName,
              lastName,
              organization: grant.Organization.name,
            })}
          />
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
        {capabilities.map((capability) => (
          <CheckboxSelector
            key={capability.key}
            variant="eduhub"
            label={capability.label}
            checked={capability.checked}
            disabled={capability.disabled}
            helpText={capability.helpText}
            updateValueMutation={capability.mutation}
            role={manageRole}
            identifierVariables={{ itemId: grant.id }}
            refetchQueries={GRANT_REFETCH_QUERIES}
          />
        ))}
      </div>
      {/* Only self-service claims carry a verification state; a grant a person made has none, and
          saying so would add noise to every other row. The note reads as two sentences — when the
          claim happened, then what that says about it — so the unverified case ends on the request
          to look, matching the marker icon on the row itself. */}
      {grant.claimVerification && (
        <div
          className={`mt-3 pt-3 border-t border-solid border-border-primary text-xs ${
            needsReview ? 'text-warning' : 'text-label-secondary'
          }`}
        >
          {grant.authorizationDeclaredAt
            ? t('claim_declared_at', {
                date: new Date(grant.authorizationDeclaredAt).toLocaleDateString(locale, {
                  timeZone: 'Europe/Berlin',
                }),
              })
            : t('claim_declared')}{' '}
          {t(`claim_verification.${grant.claimVerification}`)}
          {needsReview && isAdmin && (
            <div className="mt-2">
              <Button className="!py-1 !px-3 text-xs" onClick={handleVerifyClaim} disabled={verifying}>
                {verifying ? t('verify_claim_submitting') : t('verify_claim_button')}
              </Button>
              {verifyFailed && <div className="mt-1 text-error">{t('verify_claim_error')}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ExpandableAdminRow: FC<{
  row: AdminAccessRow;
  isSoleSettingsAdmin: (grant: AdminUserList_User_OrganizationAdmins) => boolean;
  onAdminStatusChange: () => void;
}> = ({ row, isSoleSettingsAdmin, onAdminStatusChange }) => {
  const t = useTranslations('manageAdminUsers');
  const isAdmin = useIsAdmin();
  const { user, grant, isSuperAdmin } = row;

  const [setAdminStatus] = useAdminMutation(UPDATE_USER_ADMIN_STATUS);

  const handleAdminToggle = useCallback(
    async (checked: boolean) => {
      if (!user.id) {
        return;
      }
      try {
        const response = await setAdminStatus({
          variables: {
            userId: user.id,
            isAdmin: checked,
          },
        });

        if (response.data?.updateUserAdminStatus?.success) {
          onAdminStatusChange();
        }
      } catch (error) {
        console.error('Error updating admin status:', error);
      }
    },
    [onAdminStatusChange, user.id, setAdminStatus]
  );

  return (
    <div className="light bg-fill-primary text-label-primary px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-label-secondary mb-2">
        {t('capabilities_heading')}
      </div>
      {grant ? (
        <OrganizationGrantBlock
          grant={grant}
          firstName={user.firstName}
          lastName={user.lastName}
          isAdmin={isAdmin}
          isSoleSettingsAdmin={isSoleSettingsAdmin(grant)}
          // The row's own delete control already revokes this grant — but only super-admins have
          // it, so for an org admin this stays the only way to remove the grant.
          showDelete={!isAdmin}
        />
      ) : (
        // Super-admins have platform-wide rights without administering any single organization.
        <div className="text-sm text-label-secondary">{t('no_organization_roles')}</div>
      )}
      {/* Super-admin is a property of the person, so it shows on every row of that person. */}
      {isAdmin && (
        <div className="mt-3 pt-3 border-t border-solid border-border-primary">
          <CheckboxSelector
            variant="eduhub"
            label={t('is_super_admin')}
            checked={isSuperAdmin}
            onValueUpdated={handleAdminToggle}
          />
        </div>
      )}
    </div>
  );
};

type ManageAdminUsersContentProps = {
  /** When true, rendered inside SettingsLayout (no PageBlock / page header). */
  inSettingsLayout?: boolean;
};

const ManageAdminUsersContent: FC<ManageAdminUsersContentProps> = ({ inSettingsLayout = false }) => {
  const t = useTranslations('manageAdminUsers');
  const isAdmin = useIsAdmin();
  const manageRole = useManageRole();
  const currentUserId = useUserId();
  const [privilegeFilter, setPrivilegeFilter] = useState<AdminPrivilege[]>([]);

  // Super-admin is a Keycloak role, not a database row, so the ids come from the getAdminUsers
  // action. They drive the super-admin marker/toggle and, together with the organization grants
  // below, decide which users the table lists. It is an admin-only action, so org admins must not
  // request it — they simply never see super-admin state.
  //
  // Read straight off the query result instead of mirrored into local state: several controls
  // refresh the ids by naming AdminUsers in their refetchQueries, which a state copy would miss.
  const {
    data: superAdminData,
    loading: superAdminsLoading,
    error: adminError,
    refetch: refetchSuperAdmins,
  } = useAdminQuery<AdminUsers>(ADMIN_USERS, {
    skip: !isAdmin,
    onError: (error) => {
      console.error('Error fetching admin users:', error);
    },
  });

  const superAdminUserIds = useMemo<string[]>(
    () => (superAdminData?.getAdminUsers?.success ? superAdminData.getAdminUsers.adminUserIds : []),
    [superAdminData]
  );

  // The super-admin toggle is a Keycloak action without refetchQueries of its own, so the ids have
  // to be pulled again for the checkbox, the "Super Admin" marker and the listed users to catch up.
  const handleAdminStatusChange = useCallback(async () => {
    // The query is skipped for org admins (admin-only action); refetching it would run it anyway.
    if (!isAdmin) {
      return;
    }
    try {
      await refetchSuperAdmins();
    } catch (refetchError) {
      console.error('Error refreshing admin users:', refetchError);
    }
  }, [isAdmin, refetchSuperAdmins]);

  // Every admin grant the caller may see. OrganizationAdmin has one row per (admin, organization)
  // and stays tiny next to User, so it is fetched unpaginated and drives two things: who belongs in
  // the table, and the per-organization settings-admin counts behind the sole-admin guard.
  // Role-scoped like the list: org admins see grants of their orgs, super-admins see all.
  const {
    data: grantData,
    loading: grantsLoading,
    refetch: refetchGrants,
  } = useManageQuery<AdminGrants>(ADMIN_GRANTS);

  const settingsAdminCountByOrg = useMemo(() => {
    const counts = new Map<number, number>();
    (grantData?.OrganizationAdmin ?? []).forEach((grant) => {
      if (grant.canManageSettings) {
        counts.set(grant.organizationId, (counts.get(grant.organizationId) ?? 0) + 1);
      }
    });
    return counts;
  }, [grantData]);

  const isSoleSettingsAdmin = useCallback(
    (grant: AdminUserList_User_OrganizationAdmins) =>
      !!grant.canManageSettings && (settingsAdminCountByOrg.get(grant.organizationId) ?? 0) <= 1,
    [settingsAdminCountByOrg]
  );

  // Who to show: everyone holding an organization grant, plus the super-admins from Keycloak, who
  // typically administer no organization at all and would otherwise be missing from the screen.
  //
  // The id set is assembled here rather than expressed as a database predicate on purpose. Asking
  // User for "rows that have a grant or are in this id list" cannot use the User primary key, so
  // Postgres scans the whole table — which grows with every signup — on every page change and every
  // keystroke of the search. Looking the ids up instead keeps it a primary-key lookup over a set
  // bounded by the number of admins. Sorted so the query variables stay byte-stable between
  // renders and Apollo does not refetch on an unchanged set.
  const adminUserIds = useMemo(() => {
    const ids = new Set<string>(superAdminUserIds);
    (grantData?.OrganizationAdmin ?? []).forEach((grant) => ids.add(grant.userId));
    return Array.from(ids).sort();
  }, [grantData, superAdminUserIds]);

  // Org admins additionally see only the users of organizations they administer (enforced by the
  // org_admin User select permission) and only the grants of those organizations (OrganizationAdmin
  // select permission). useManageQuery pins admin vs org_admin accordingly.
  const buildFilter = useCallback(
    (searchFilter: string) => {
      const isAdminUser: User_bool_exp = { id: { _in: adminUserIds } };

      const searchCondition = createMultiWordSearchCondition(searchFilter, [
        'lastName',
        'firstName',
        'email',
        'Organization.name',
        'OrganizationAdmins.Organization.name',
      ]);

      const privilegeCondition = buildPrivilegeCondition(privilegeFilter, superAdminUserIds);

      const conditions: User_bool_exp[] = [isAdminUser];
      if (Object.keys(searchCondition).length > 0) {
        conditions.push(searchCondition);
      }
      if (privilegeCondition) {
        conditions.push(privilegeCondition);
      }

      return { filter: conditions.length > 1 ? { _and: conditions } : isAdminUser };
    },
    [adminUserIds, privilegeFilter, superAdminUserIds]
  );

  const { data, loading, error, pageIndex, setPageIndex, searchFilter, setSearchFilter, sorting, setSorting, refetch } =
    useTableGrid({
      queryHook: useManageQuery,
      query: ADMIN_USER_LIST,
      pageSize: 15,
      defaultSort: [{ lastName: order_by.asc }, { firstName: order_by.asc }],
      sortColumnMapper: (columnId) => {
        switch (columnId) {
          case 'firstName':
            return 'firstName';
          case 'lastName':
            return 'lastName';
          case 'email':
            return 'email';
          case 'profileOrganization':
            return { Organization: { name: null } };
          default:
            return null;
        }
      },
      refetchFilter: buildFilter,
    });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Changing a filter changes which users match, so the paging has to start over.
  const handlePrivilegeFilterChange = useCallback(
    (selected: string[]) => {
      setPrivilegeFilter(selected as AdminPrivilege[]);
      setPageIndex(0);
    },
    [setPageIndex]
  );

  const privilegeOptions = useMemo(
    () =>
      ADMIN_PRIVILEGES
        // Org admins never see super-admin state, so they cannot filter on it either.
        .filter((privilege) => isAdmin || privilege !== 'superAdmin')
        .map((privilege) => ({ value: privilege, label: t(privilegeLabelKey(privilege)) })),
    [isAdmin, t]
  );

  const [revokeSuperAdmin] = useAdminMutation(UPDATE_USER_ADMIN_STATUS);
  const [deleteGrant] = useAdminMutation(DELETE_ORGANIZATION_ADMIN);

  // A row stands for one person's rights for one organization, so deleting it revokes exactly that
  // grant and leaves the Keycloak super-admin role alone: a super-admin who administers three
  // organizations loses one of them and stays a super-admin, with two rows left. The row of a
  // super-admin who administers nothing stands for the role itself, so there it revokes the role.
  //
  // Two different operations behind one control, hence TableGrid's onRowDelete. Super-admins only:
  // revoking the role needs the admin-only updateUserAdminStatus action, and only a super-admin is
  // exempt from the DB guard that keeps the last settings admin of an organization in place.
  const handleRowDelete = useCallback(
    async (row: AdminAccessRow) => {
      if (row.grant) {
        await deleteGrant({ variables: { id: row.grant.id } });
      } else {
        const response = await revokeSuperAdmin({ variables: { userId: row.user.id, isAdmin: false } });
        if (!response.data?.updateUserAdminStatus?.success) {
          // Rejecting shows the delete button's error dialog.
          throw new Error(response.data?.updateUserAdminStatus?.error ?? 'updateUserAdminStatus failed');
        }
      }
      await Promise.all([refetch(), refetchGrants(), refetchSuperAdmins()]);
    },
    [deleteGrant, revokeSuperAdmin, refetch, refetchGrants, refetchSuperAdmins]
  );

  // Organizations the current user may add admins to. Super-admins pick from all organizations; org
  // admins are restricted to those they administer with the canManageSettings capability (the same
  // capability Hasura enforces on insert).
  const { data: allOrganizationsData } = useAdminQuery<OrganizationOptions, OrganizationOptionsVariables>(
    ORGANIZATION_OPTIONS,
    { skip: !isAdmin }
  );
  const { data: manageableOrganizationsData } = useOrgAdminQuery<
    ManageableOrganizations,
    ManageableOrganizationsVariables
  >(MANAGEABLE_ORGANIZATIONS, {
    skip: isAdmin || !currentUserId,
    variables: { currentUserId: currentUserId ?? '' },
  });

  const organizationOptions = useMemo<AdminOrganizationOption[]>(() => {
    if (isAdmin) {
      return (allOrganizationsData?.Organization ?? []).map((organization) => ({
        id: organization.id,
        name: organization.name,
      }));
    }
    const byId = new Map<number, string>();
    (manageableOrganizationsData?.OrganizationAdmin ?? []).forEach((grant) => {
      if (grant.Organization) {
        byId.set(grant.Organization.id, grant.Organization.name);
      }
    });
    return Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [isAdmin, allOrganizationsData, manageableOrganizationsData]);

  // Super-admins can always add someone (at minimum as a super-admin); org admins only when they may
  // add to at least one organization, which hides the button from those without settings rights.
  const canAddAdmins = isAdmin || organizationOptions.length > 0;

  // Organizations the caller may add admins to that have nobody with canManageSettings. The
  // database stopped forcing that capability onto an organization's first admin, so the add dialog
  // pre-checks it for these rather than letting an organization end up with nobody able to manage
  // its admin team or its settings.
  const organizationIdsWithoutSettingsAdmin = useMemo(
    () =>
      organizationOptions
        .map((organization) => organization.id)
        .filter((id) => (settingsAdminCountByOrg.get(id) ?? 0) === 0),
    [organizationOptions, settingsAdminCountByOrg]
  );

  const columns = useMemo<ColumnDef<AdminAccessRow>[]>(() => {
    // The sortable columns are all properties of the person, matching the query, which pages and
    // sorts by person and keeps that person's organization rows together.
    const baseColumns: ColumnDef<AdminAccessRow>[] = [
      {
        id: 'firstName',
        header: t('first_name'),
        enableSorting: true,
        size: 140,
        cell: ({ row }) => <div className="truncate">{row.original.user.firstName}</div>,
      },
      {
        id: 'lastName',
        header: t('last_name'),
        enableSorting: true,
        size: 140,
        cell: ({ row }) => <div className="truncate">{row.original.user.lastName}</div>,
      },
      {
        // The organization the user belongs to according to their own profile (independent of the
        // organization they administer in this row).
        id: 'profileOrganization',
        header: t('profile_organization'),
        enableSorting: true,
        size: 180,
        cell: ({ row }) => <div className="truncate">{row.original.user.Organization?.name ?? ''}</div>,
      },
      {
        id: 'email',
        header: t('email'),
        enableSorting: true,
        size: 220,
        cell: ({ row }) => <div className="truncate">{row.original.user.email}</div>,
      },
      {
        // The one organization this row is about: expanding shows its capabilities, and the row's
        // delete control revokes exactly this grant.
        id: 'administeredOrganization',
        header: t('administered_organization'),
        enableSorting: false,
        size: 220,
        cell: ({ row }) =>
          row.original.grant ? (
            <div className="truncate">{row.original.grant.Organization.name}</div>
          ) : (
            // A super-admin who administers no organization: the row stands for the role alone.
            <div className="truncate text-label-secondary">{t('super_admin_only')}</div>
          ),
      },
    ];

    // A leading marker column carries what is worth seeing without expanding a row: the super-admin
    // role, and a self-service claim nobody has checked yet. Icons with tooltips rather than inline
    // text, which would crowd the name columns. Super-admin status is only ever visible to
    // super-admins (the set is empty for org admins), so the star simply never renders for the
    // others, while the review marker is for whoever manages the organization's admin team.
    return [
      {
        id: 'markers',
        header: '',
        enableSorting: false,
        // Wide enough for both markers side by side: a super-admin can hold a claimed grant too.
        size: 56,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <div className="flex justify-center items-center gap-1">
            {row.original.isSuperAdmin && (
              <span className="flex" title={t('super_admin_label')}>
                <MdStar className="text-brand" size="1.25em" aria-label={t('super_admin_label')} />
              </span>
            )}
            {claimNeedsReview(row.original.grant) && (
              <span className="flex" title={t('claim_needs_review_label')}>
                <MdWarningAmber className="text-warning" size="1.25em" aria-label={t('claim_needs_review_label')} />
              </span>
            )}
          </div>
        ),
      },
      ...baseColumns,
    ];
  }, [t]);

  // One row per administered organization. The query pages and sorts by person, so a page holds
  // `pageSize` people and renders one row for each organization they administer — their rows stay
  // adjacent, and the pagination below counts people.
  const accessRows = useMemo(
    () => toAccessRows(data?.User ?? [], superAdminUserIds, privilegeFilter),
    [data, superAdminUserIds, privilegeFilter]
  );

  // The listed users are derived from the grants and the Keycloak super-admins, so the table must
  // not render before both have resolved — it would show an empty list and then fill in. Both flags
  // also drop on error (and superAdminsLoading stays false for org admins, who skip that query), so
  // a failing Keycloak call still renders the table with the error banner above it.
  const isLoading = loading || grantsLoading || superAdminsLoading;

  const table = (
    <>
      {isLoading && <Loading />}
      {(adminError || error) && <div className="text-red-500 p-4">{t('error_loading_admin_users')}</div>}
      {!isLoading && !error && (
        <div>
          {!inSettingsLayout && <CommonPageHeader headline={t('headline')} />}
          <TableGrid<AdminAccessRow>
            columns={columns}
            {...(canAddAdmins
              ? { onAddButtonClick: () => setIsAddDialogOpen(true), addButtonText: t('add_admin_button') }
              : {})}
            data={accessRows}
            totalCount={data?.User_aggregate?.aggregate?.count || 0}
            pageIndex={pageIndex}
            onPageChange={setPageIndex}
            searchFilter={searchFilter}
            onSearchFilterChange={setSearchFilter}
            sorting={sorting}
            onSortingChange={setSorting}
            role={manageRole}
            error={error}
            loading={isLoading}
            refetchQueries={['AdminUserList', 'AdminUsers', 'AdminGrants']}
            filters={[
              {
                id: 'privileges',
                label: t('privileges_filter_label'),
                options: privilegeOptions,
                selected: privilegeFilter,
                onChange: handlePrivilegeFilterChange,
              },
            ]}
            {...(isAdmin
              ? {
                  onRowDelete: handleRowDelete,
                  // Revoking your own super-admin role would lock you out of this screen. Losing
                  // one of your own organizations is harmless — the role is left untouched.
                  canDeleteRow: (row: AdminAccessRow) => row.grant !== null || row.user.id !== currentUserId,
                  // The question names the person and the one organization the row is about.
                  generateDeletionConfirmationQuestion: (row: AdminAccessRow) =>
                    row.grant
                      ? t(
                          row.isSuperAdmin
                            ? 'deletion_confirmation_question_super_admin'
                            : 'deletion_confirmation_question',
                          {
                            firstName: row.user.firstName,
                            lastName: row.user.lastName,
                            organization: row.grant.Organization.name,
                          }
                        )
                      : t('remove_super_admin_confirmation_question', {
                          firstName: row.user.firstName,
                          lastName: row.user.lastName,
                        }),
                }
              : {})}
            expandableRowComponent={({ row }) => (
              <ExpandableAdminRow
                row={row}
                isSoleSettingsAdmin={isSoleSettingsAdmin}
                onAdminStatusChange={handleAdminStatusChange}
              />
            )}
          />
          <AddAdminDialog
            open={isAddDialogOpen}
            onClose={() => setIsAddDialogOpen(false)}
            onSuccess={() => {
              // Refetch the list, the settings-admin counts (so sole-admin disabling and the
              // first-settings-admin hint stay correct) and the super-admin ids (so a newly
              // promoted super-admin appears in the list at all).
              refetch();
              refetchGrants();
              handleAdminStatusChange();
            }}
            organizationOptions={organizationOptions}
            canGrantSuperAdmin={isAdmin}
            organizationIdsWithoutSettingsAdmin={organizationIdsWithoutSettingsAdmin}
          />
        </div>
      )}
    </>
  );

  if (inSettingsLayout) {
    return table;
  }

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">{table}</div>
    </PageBlock>
  );
};

export default ManageAdminUsersContent;
