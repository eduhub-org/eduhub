import { FC, ReactNode, useMemo, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { DocumentNode } from 'graphql';
import { MdStar } from 'react-icons/md';

import TableGrid from '../../common/TableGrid';
import TableGridDeleteButton from '../../common/TableGrid/components/TableGridDeleteButton';
import Loading from '../../common/Loading';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import CheckboxSelector from '../../inputs/CheckboxSelector';

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
} from '../../../queries/organizationAdmin';
import { ORGANIZATION_OPTIONS } from '../../../queries/organization';
import { UPDATE_USER_ADMIN_STATUS, ADMIN_USERS } from '../../../queries/actions';
import { PageBlock } from '../../common/PageBlock';
import CommonPageHeader from '../../common/CommonPageHeader';
import { useIsAdmin, useManageRole } from '../../../hooks/authentication';
import { useUserId } from '../../../hooks/user';
import { AdminUserList_User, AdminUserList_User_OrganizationAdmins } from '../../../queries/__generated__/AdminUserList';
import { OrganizationOptions, OrganizationOptionsVariables } from '../../../queries/__generated__/OrganizationOptions';
import {
  ManageableOrganizations,
  ManageableOrganizationsVariables,
} from '../../../queries/__generated__/ManageableOrganizations';
import { AdminGrants } from '../../../queries/__generated__/AdminGrants';
import { User_bool_exp, order_by } from '../../../__generated__/globalTypes';
import AddAdminDialog, { AdminOrganizationOption } from './AddAdminDialog';

// Every mutation on a grant changes both the list (capabilities, and possibly whether the user is
// listed at all) and the per-organization settings-admin counts that gate the sole-admin guard.
const GRANT_REFETCH_QUERIES = ['AdminUserList', 'AdminGrants'];

/**
 * One administered organization of an admin user: its capability flags plus the control to revoke
 * the whole grant. A user with several organizations gets one of these blocks per organization.
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
}> = ({ grant, firstName, lastName, isAdmin, isSoleSettingsAdmin }) => {
  const t = useTranslations('manageAdminUsers');
  const manageRole = useManageRole();

  // Non-super-admins cannot clear the last settings admin of an org; super-admins bypass the guard.
  const settingsLocked = isSoleSettingsAdmin && !isAdmin;

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
    </div>
  );
};

const ExpandableAdminRow: FC<{
  row: AdminUserList_User;
  isSuperAdmin: boolean;
  isSoleSettingsAdmin: (grant: AdminUserList_User_OrganizationAdmins) => boolean;
  onAdminStatusChange: () => void;
}> = ({ row, isSuperAdmin, isSoleSettingsAdmin, onAdminStatusChange }) => {
  const t = useTranslations('manageAdminUsers');
  const isAdmin = useIsAdmin();

  const [setAdminStatus] = useAdminMutation(UPDATE_USER_ADMIN_STATUS);

  const handleAdminToggle = useCallback(
    async (checked: boolean) => {
      if (!row.id) {
        return;
      }
      try {
        const response = await setAdminStatus({
          variables: {
            userId: row.id,
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
    [onAdminStatusChange, row.id, setAdminStatus]
  );

  return (
    <div className="light bg-fill-primary text-label-primary px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-label-secondary mb-2">
        {t('capabilities_heading')}
      </div>
      {row.OrganizationAdmins.length > 0 ? (
        <div className="space-y-3">
          {row.OrganizationAdmins.map((grant) => (
            <OrganizationGrantBlock
              key={grant.id}
              grant={grant}
              firstName={row.firstName}
              lastName={row.lastName}
              isAdmin={isAdmin}
              isSoleSettingsAdmin={isSoleSettingsAdmin(grant)}
            />
          ))}
        </div>
      ) : (
        // Super-admins have platform-wide rights without administering any single organization.
        <div className="text-sm text-label-secondary">{t('no_organization_roles')}</div>
      )}
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
  const [superAdminUserIds, setSuperAdminUserIds] = useState<string[]>([]);
  const [adminError, setAdminError] = useState<Error | null>(null);

  // Super-admin is a Keycloak role, not a database row, so the ids come from the getAdminUsers
  // action. They drive the super-admin marker/toggle and, together with the organization grants
  // below, decide which users the table lists. It is an admin-only action, so org admins must not
  // request it — they simply never see super-admin state.
  const { loading: superAdminsLoading, refetch: refetchSuperAdmins } = useAdminQuery(ADMIN_USERS, {
    skip: !isAdmin,
    onCompleted: (data) => {
      if (data?.getAdminUsers?.success) {
        setSuperAdminUserIds(data.getAdminUsers.adminUserIds);
      }
    },
    onError: (error) => {
      console.error('Error fetching admin users:', error);
      setAdminError(error);
    },
  });

  // The super-admin checkbox is controlled by `superAdminUserIds` (derived from the AdminUsers
  // query), which is held in local state. After a toggle we must refetch that query and refresh the
  // state so the checkbox, the "Super Admin" marker and the listed users reflect the change.
  const handleAdminStatusChange = useCallback(async () => {
    // The query is skipped for org admins (admin-only action); refetching it would run it anyway.
    if (!isAdmin) {
      return;
    }
    try {
      const { data: adminData } = await refetchSuperAdmins();
      if (adminData?.getAdminUsers?.success) {
        setSuperAdminUserIds(adminData.getAdminUsers.adminUserIds);
      }
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

      return {
        filter: Object.keys(searchCondition).length > 0 ? { _and: [isAdminUser, searchCondition] } : isAdminUser,
      };
    },
    [adminUserIds]
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

  const columns = useMemo<ColumnDef<AdminUserList_User>[]>(() => {
    const baseColumns: ColumnDef<AdminUserList_User>[] = [
      {
        header: t('first_name'),
        accessorKey: 'firstName',
        enableSorting: true,
        size: 140,
        cell: ({ getValue }) => <div className="truncate">{getValue<ReactNode>()}</div>,
      },
      {
        header: t('last_name'),
        accessorKey: 'lastName',
        enableSorting: true,
        size: 140,
        cell: ({ getValue }) => <div className="truncate">{getValue<ReactNode>()}</div>,
      },
      {
        // The organization the user belongs to according to their own profile (independent of the
        // organizations they administer).
        id: 'profileOrganization',
        header: t('profile_organization'),
        enableSorting: true,
        size: 180,
        cell: ({ row }) => <div className="truncate">{row.original.Organization?.name ?? ''}</div>,
      },
      {
        header: t('email'),
        accessorKey: 'email',
        enableSorting: true,
        size: 220,
        cell: ({ getValue }) => <div className="truncate">{getValue<ReactNode>()}</div>,
      },
      {
        // Every organization this user administers. Expanding the row shows the capabilities per
        // organization. Empty for a super-admin without any organization role.
        id: 'administeredOrganizations',
        header: t('administered_organizations'),
        enableSorting: false,
        size: 220,
        cell: ({ row }) => {
          const names = row.original.OrganizationAdmins.map((grant) => grant.Organization.name);
          return <div className="truncate">{names.length > 0 ? names.join(', ') : '–'}</div>;
        },
      },
    ];

    // Only super-admins can see super-admin status (the set is empty for org admins), so the
    // marker column is added for them only. It is kept short and shows a star icon (with a tooltip)
    // instead of inline text, which would otherwise crowd the name columns.
    if (!isAdmin) {
      return baseColumns;
    }

    return [
      {
        id: 'superAdmin',
        header: '',
        enableSorting: false,
        size: 44,
        meta: { align: 'center' },
        cell: ({ row }) =>
          superAdminUserIds.includes(row.original.id) ? (
            <div className="flex justify-center" title={t('super_admin_label')}>
              <MdStar className="text-brand" size="1.25em" aria-label={t('super_admin_label')} />
            </div>
          ) : null,
      },
      ...baseColumns,
    ];
  }, [t, superAdminUserIds, isAdmin]);

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
          <TableGrid<AdminUserList_User>
            columns={columns}
            {...(canAddAdmins
              ? { onAddButtonClick: () => setIsAddDialogOpen(true), addButtonText: t('add_admin_button') }
              : {})}
            data={data?.User || []}
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
            expandableRowComponent={({ row }) => (
              <ExpandableAdminRow
                row={row}
                isSuperAdmin={superAdminUserIds.includes(row.id)}
                isSoleSettingsAdmin={isSoleSettingsAdmin}
                onAdminStatusChange={handleAdminStatusChange}
              />
            )}
          />
          <AddAdminDialog
            open={isAddDialogOpen}
            onClose={() => setIsAddDialogOpen(false)}
            onSuccess={() => {
              // Refetch the list (so a first admin's DB-forced canManageSettings shows), the
              // settings-admin counts (so sole-admin disabling stays correct) and the super-admin
              // ids (so a newly promoted super-admin appears in the list at all).
              refetch();
              refetchGrants();
              handleAdminStatusChange();
            }}
            organizationOptions={organizationOptions}
            canGrantSuperAdmin={isAdmin}
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
