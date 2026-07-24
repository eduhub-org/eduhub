import { FC, ReactNode, useMemo, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { DocumentNode } from 'graphql';
import { MdStar } from 'react-icons/md';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import CheckboxSelector from '../../inputs/CheckboxSelector';

import { useAdminQuery, useManageQuery, useOrgAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  ORGANIZATION_ADMIN_LIST,
  DELETE_ORGANIZATION_ADMIN,
  MANAGEABLE_ORGANIZATIONS,
  SETTINGS_ADMIN_GRANTS,
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
import { OrganizationAdminList_OrganizationAdmin } from '../../../queries/__generated__/OrganizationAdminList';
import { OrganizationOptions, OrganizationOptionsVariables } from '../../../queries/__generated__/OrganizationOptions';
import {
  ManageableOrganizations,
  ManageableOrganizationsVariables,
} from '../../../queries/__generated__/ManageableOrganizations';
import { SettingsAdminGrants } from '../../../queries/__generated__/SettingsAdminGrants';
import AddOrganizationAdminDialog, { AdminOrganizationOption } from './AddOrganizationAdminDialog';

const ExpandableUserRow: FC<{
  row: OrganizationAdminList_OrganizationAdmin;
  isSuperAdmin: boolean;
  // True when this grant is the only settings admin of its organization: the settings capability
  // must not be turned off here (the DB guard would reject it), so the checkbox is disabled —
  // unless the viewer is a super-admin, who bypasses the guard at the DB level.
  isSoleSettingsAdmin: boolean;
  onAdminStatusChange: () => void;
}> = ({ row, isSuperAdmin, isSoleSettingsAdmin, onAdminStatusChange }) => {
  const t = useTranslations('manageAdminUsers');
  const isAdmin = useIsAdmin();
  const manageRole = useManageRole();

  // Non-super-admins cannot clear the last settings admin of an org; super-admins bypass the guard.
  const settingsLocked = isSoleSettingsAdmin && !isAdmin;

  const [setAdminStatus] = useAdminMutation(UPDATE_USER_ADMIN_STATUS);

  const handleAdminToggle = useCallback(
    async (checked: boolean) => {
      // row.id is the OrganizationAdmin grant id; the super-admin action keys off the User id.
      if (!row.User?.id) {
        return;
      }
      try {
        const response = await setAdminStatus({
          variables: {
            userId: row.User.id,
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
    [onAdminStatusChange, row.User?.id, setAdminStatus]
  );

  const capabilities = useMemo<
    {
      key: string;
      label: string;
      checked: boolean;
      mutation: DocumentNode;
      disabled?: boolean;
      helpText?: string;
      refetchQueries?: string[];
    }[]
  >(
    () => [
      {
        key: 'events',
        label: t('can_manage_events'),
        checked: row.canManageEvents,
        mutation: UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_EVENTS,
      },
      {
        key: 'courses',
        label: t('can_manage_courses'),
        checked: row.canManageCourses,
        mutation: UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_COURSES,
      },
      {
        key: 'degrees',
        label: t('can_manage_degrees'),
        checked: row.canManageDegrees,
        mutation: UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_DEGREES,
      },
      {
        key: 'jobs',
        label: t('can_manage_jobs'),
        checked: row.canManageJobs,
        mutation: UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_JOBS,
      },
      {
        key: 'settings',
        label: t('can_manage_users_and_settings'),
        checked: row.canManageSettings,
        mutation: UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_SETTINGS,
        // Sole settings admin: block turning it off (except for super-admins, who bypass the DB
        // guard). Refetch the list + counts on toggle so the disabled state stays in sync after
        // granting settings to someone else first.
        disabled: settingsLocked,
        helpText: settingsLocked ? t('sole_settings_admin_hint') : undefined,
        refetchQueries: ['OrganizationAdminList', 'SettingsAdminGrants'],
      },
    ],
    [row, t, settingsLocked]
  );

  return (
    <div className="light bg-fill-primary text-label-primary px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-label-secondary mb-2">
        {t('capabilities_heading')}
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
            identifierVariables={{ itemId: row.id }}
            refetchQueries={capability.refetchQueries ?? ['GetAdminUsers']}
          />
        ))}
      </div>
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
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const [adminError, setAdminError] = useState<Error | null>(null);

  // The super-admin list drives only the super-admin toggle, which is shown to super-admins only.
  // It is also an admin-only action, so org admins must not request it.
  const { refetch: refetchAdminUsers } = useAdminQuery(ADMIN_USERS, {
    skip: !isAdmin,
    onCompleted: (data) => {
      if (data?.getAdminUsers?.success) {
        setAdminUserIds(data.getAdminUsers.adminUserIds);
      }
    },
    onError: (error) => {
      console.error('Error fetching admin users:', error);
      setAdminError(error);
    },
  });

  // The super-admin checkbox is controlled by `adminUserIds` (derived from the AdminUsers query),
  // which is held in local state. After a toggle we must refetch that query and refresh the state so
  // the checkbox and "Super Admin" marker reflect the change (refetching the grid query does not).
  const handleAdminStatusChange = useCallback(async () => {
    try {
      const { data: adminData } = await refetchAdminUsers();
      if (adminData?.getAdminUsers?.success) {
        setAdminUserIds(adminData.getAdminUsers.adminUserIds);
      }
    } catch (refetchError) {
      console.error('Error refreshing admin users:', refetchError);
    }
  }, [refetchAdminUsers]);

  // Org admins see only the grants of organizations they administer (enforced by the org_admin
  // select permission); super-admins see all. useManageQuery pins the role accordingly.
  const { data, loading, error, pageIndex, setPageIndex, searchFilter, setSearchFilter, refetch } = useTableGrid({
    queryHook: useManageQuery,
    query: ORGANIZATION_ADMIN_LIST,
    pageSize: 15,
    refetchFilter: (searchFilter) => {
      const searchCondition = createMultiWordSearchCondition(searchFilter, [
        'User.lastName',
        'User.firstName',
        'User.email',
        'Organization.name',
      ]);
      return {
        filter: searchCondition,
      };
    },
  });

  // Per-organization count of settings admins, so the UI can pre-disable removing/deleting the
  // *last* one for an org (the DB guard enforces the same rule). Role-scoped like the list: org
  // admins see grants of their orgs, super-admins see all. Refetched after add/toggle/delete.
  const { data: settingsAdminData, refetch: refetchSettingsAdmins } =
    useManageQuery<SettingsAdminGrants>(SETTINGS_ADMIN_GRANTS);

  const settingsAdminCountByOrg = useMemo(() => {
    const counts = new Map<number, number>();
    (settingsAdminData?.OrganizationAdmin ?? []).forEach((grant) => {
      counts.set(grant.organizationId, (counts.get(grant.organizationId) ?? 0) + 1);
    });
    return counts;
  }, [settingsAdminData]);

  const isSoleSettingsAdmin = useCallback(
    (row: OrganizationAdminList_OrganizationAdmin) => {
      const orgId = row.Organization?.id;
      return !!row.canManageSettings && orgId != null && (settingsAdminCountByOrg.get(orgId) ?? 0) <= 1;
    },
    [settingsAdminCountByOrg]
  );

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Organizations the current user may add admins to. Super-admins pick from all organizations; org
  // admins are restricted to those they administer with the canManageSettings capability (the same
  // capability Hasura enforces on insert). The add button is shown only when at least one option
  // exists, which also hides it from org admins who cannot manage users/settings anywhere.
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

  const canAddAdmins = organizationOptions.length > 0;

  const columns = useMemo<ColumnDef<OrganizationAdminList_OrganizationAdmin>[]>(() => {
    const baseColumns: ColumnDef<OrganizationAdminList_OrganizationAdmin>[] = [
      {
        // The organization the user administers. The grant's organization is always shown: the row's
        // capability toggles and delete action target that specific grant, so it must stay
        // identifiable even for super-admins with several grants.
        header: t('organization'),
        accessorKey: 'Organization.name',
        enableSorting: true,
        size: 180,
        cell: ({ getValue }) => <div className="truncate">{getValue<ReactNode>()}</div>,
      },
      {
        header: t('first_name'),
        accessorKey: 'User.firstName',
        enableSorting: true,
        size: 140,
        cell: ({ getValue }) => <div className="truncate">{getValue<ReactNode>()}</div>,
      },
      {
        header: t('last_name'),
        accessorKey: 'User.lastName',
        enableSorting: true,
        size: 140,
        cell: ({ getValue }) => <div className="truncate">{getValue<ReactNode>()}</div>,
      },
      {
        // The organization the user belongs to according to their own profile (independent of the
        // organizations they administer).
        header: t('profile_organization'),
        accessorKey: 'User.Organization.name',
        enableSorting: true,
        size: 180,
        cell: ({ row }) => <div className="truncate">{row.original.User?.Organization?.name ?? ''}</div>,
      },
      {
        header: t('email'),
        accessorKey: 'User.email',
        enableSorting: true,
        size: 220,
        cell: ({ getValue }) => <div className="truncate">{getValue<ReactNode>()}</div>,
      },
    ];

    // Only super-admins can see super-admin status (adminUserIds is empty for org admins), so the
    // marker column is added for them only. It is kept short and shows a star icon (with a tooltip)
    // instead of inline text, which would otherwise crowd the organization name.
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
          adminUserIds.includes(row.original.User?.id) ? (
            <div className="flex justify-center" title={t('super_admin_label')}>
              <MdStar className="text-brand" size="1.25em" aria-label={t('super_admin_label')} />
            </div>
          ) : null,
      },
      ...baseColumns,
    ];
  }, [t, adminUserIds, isAdmin]);

  const generateDeletionConfirmation = useCallback(
    (row: OrganizationAdminList_OrganizationAdmin) => {
      return t('deletion_confirmation_question', {
        firstName: row.User?.firstName,
        lastName: row.User?.lastName,
        organization: row.Organization?.name,
      });
    },
    [t]
  );

  const table = (
    <>
      {loading && <Loading />}
      {adminError && <div className="text-red-500 p-4">{t('error_loading_admin_users')}</div>}
      {!loading && !error && (
        <div>
          {!inSettingsLayout && <CommonPageHeader headline={t('headline')} />}
          <TableGrid
              columns={columns}
              {...(canAddAdmins
                ? { onAddButtonClick: () => setIsAddDialogOpen(true), addButtonText: t('add_admin_button') }
                : {})}
              data={data?.OrganizationAdmin || []}
              totalCount={data?.OrganizationAdmin_aggregate?.aggregate?.count || 0}
              pageIndex={pageIndex}
              onPageChange={setPageIndex}
              searchFilter={searchFilter}
              onSearchFilterChange={setSearchFilter}
              deleteMutation={DELETE_ORGANIZATION_ADMIN}
              deleteIdType="number"
              // Block deleting the last settings admin of an org (the DB guard would reject it too),
              // except for super-admins, who bypass the guard at the DB level.
              canDeleteRow={(row) => isAdmin || !isSoleSettingsAdmin(row)}
              role={manageRole}
              error={error}
              loading={loading}
              refetchQueries={['OrganizationAdminList', 'AdminUsers', 'SettingsAdminGrants']}
              generateDeletionConfirmationQuestion={generateDeletionConfirmation}
              expandableRowComponent={({ row }) => (
                <ExpandableUserRow
                  row={row}
                  isSuperAdmin={adminUserIds.includes(row.User?.id)}
                  isSoleSettingsAdmin={isSoleSettingsAdmin(row)}
                  onAdminStatusChange={handleAdminStatusChange}
                />
              )}
            />
            <AddOrganizationAdminDialog
              open={isAddDialogOpen}
              onClose={() => setIsAddDialogOpen(false)}
              onSuccess={() => {
                // Refetch the list (so a first admin's DB-forced canManageSettings shows) and the
                // settings-admin counts (so sole-admin disabling stays correct).
                refetch();
                refetchSettingsAdmins();
              }}
              organizationOptions={organizationOptions}
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
