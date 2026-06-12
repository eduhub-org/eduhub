import { FC, ReactNode, useMemo, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';

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
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_EVENTS,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_COURSES,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_DEGREES,
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
import AddOrganizationAdminDialog, { AdminOrganizationOption } from './AddOrganizationAdminDialog';

const ExpandableUserRow: FC<{
  row: OrganizationAdminList_OrganizationAdmin;
  isSuperAdmin: boolean;
  onAdminStatusChange: () => void;
}> = ({ row, isSuperAdmin, onAdminStatusChange }) => {
  const t = useTranslations('manageAdminUsers');
  const isAdmin = useIsAdmin();
  const manageRole = useManageRole();

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

        if (response.data?.success) {
          onAdminStatusChange();
        }
      } catch (error) {
        console.error('Error updating admin status:', error);
      }
    },
    [onAdminStatusChange, row.User?.id, setAdminStatus]
  );

  return (
    <div>
      <div className="font-medium bg-fill-primary text-label-primary light grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))]">
        <div className="pl-3 col-span-3">
          <CheckboxSelector
            variant="eduhub"
            label={t('can_manage_events')}
            checked={row.canManageEvents}
            updateValueMutation={UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_EVENTS}
            role={manageRole}
            identifierVariables={{ itemId: row.id }}
            refetchQueries={['GetAdminUsers']}
          />
        </div>
        <div className="pl-3 col-span-3">
          <CheckboxSelector
            variant="eduhub"
            label={t('can_manage_courses')}
            checked={row.canManageCourses}
            updateValueMutation={UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_COURSES}
            role={manageRole}
            identifierVariables={{ itemId: row.id }}
            refetchQueries={['GetAdminUsers']}
          />
        </div>
        <div className="pl-3 col-span-3">
          <CheckboxSelector
            variant="eduhub"
            label={t('can_manage_degrees')}
            checked={row.canManageDegrees}
            updateValueMutation={UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_DEGREES}
            role={manageRole}
            identifierVariables={{ itemId: row.id }}
            refetchQueries={['GetAdminUsers']}
          />
        </div>
        <div className="pl-3 col-span-3">
          <CheckboxSelector
            variant="eduhub"
            label={t('can_manage_users_and_settings')}
            checked={row.canManageSettings}
            updateValueMutation={UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_SETTINGS}
            role={manageRole}
            identifierVariables={{ itemId: row.id }}
            refetchQueries={['GetAdminUsers']}
          />
        </div>
      </div>
      {isAdmin && (
        <div className="pl-3 col-span-3">
          <CheckboxSelector
            variant="eduhub"
            label={t('is_super_admin')}
            checked={isSuperAdmin}
            onValueUpdated={handleAdminToggle}
            refetchQueries={['GetAdminUsers']}
          />
        </div>
      )}
    </div>
  );
};

const ManageAdminUsersContent: FC = () => {
  const t = useTranslations('manageAdminUsers');
  const isAdmin = useIsAdmin();
  const manageRole = useManageRole();
  const currentUserId = useUserId();
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const [adminError, setAdminError] = useState<Error | null>(null);

  // The super-admin (Admin table) list drives only the super-admin toggle, which is shown to
  // super-admins only. It is also an admin-only action, so org admins must not request it.
  useAdminQuery(ADMIN_USERS, {
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

  const columns = useMemo<ColumnDef<OrganizationAdminList_OrganizationAdmin>[]>(
    () => [
      {
        // The organization the user administers. The grant's organization is always shown (the row's
        // capability toggles and delete action target that specific grant, so it must stay
        // identifiable even for super-admins with several grants); super-admins additionally get a
        // "Super Admin" marker next to the organization name.
        header: t('organization'),
        accessorKey: 'Organization.name',
        enableSorting: true,
        size: 180,
        cell: ({ row, getValue }) => (
          <div className="truncate">
            {adminUserIds.includes(row.original.User?.id) && (
              <span className="font-medium mr-2">{t('super_admin_label')}</span>
            )}
            {getValue<ReactNode>()}
          </div>
        ),
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
    ],
    [t, adminUserIds]
  );

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

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">
        {loading && <Loading />}
        {adminError && <div className="text-red-500 p-4">{t('error_loading_admin_users')}</div>}
        {!loading && !error && (
          <div>
            <CommonPageHeader headline={t('headline')} />
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
              role={manageRole}
              error={error}
              loading={loading}
              refetchQueries={['UsersByLastName', 'GetAdminUsers']}
              generateDeletionConfirmationQuestion={generateDeletionConfirmation}
              expandableRowComponent={({ row }) => (
                <ExpandableUserRow
                  row={row}
                  isSuperAdmin={adminUserIds.includes(row.User?.id)}
                  onAdminStatusChange={() => refetch()}
                />
              )}
            />
            <AddOrganizationAdminDialog
              open={isAddDialogOpen}
              onClose={() => setIsAddDialogOpen(false)}
              onSuccess={() => refetch()}
              organizationOptions={organizationOptions}
            />
          </div>
        )}
      </div>
    </PageBlock>
  );
};

export default ManageAdminUsersContent;
