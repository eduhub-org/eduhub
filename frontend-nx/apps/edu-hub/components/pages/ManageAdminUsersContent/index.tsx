import { FC, ReactNode, useMemo, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import CheckboxSelector from '../../inputs/CheckboxSelector';

import { useAdminQuery, useManageQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  ORGANIZATION_ADMIN_LIST,
  DELETE_ORGANIZATION_ADMIN,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_EVENTS,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_COURSES,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_DEGREES,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_SETTINGS,
} from '../../../queries/organizationAdmin';
import { UPDATE_USER_ADMIN_STATUS, ADMIN_USERS } from '../../../queries/actions';
import { PageBlock } from '../../common/PageBlock';
import CommonPageHeader from '../../common/CommonPageHeader';
import { useIsAdmin, useManageRole } from '../../../hooks/authentication';
import { OrganizationAdminList_OrganizationAdmin } from '../../../queries/__generated__/OrganizationAdminList';

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

  const columns = useMemo<ColumnDef<OrganizationAdminList_OrganizationAdmin>[]>(
    () => [
      {
        header: t('organization'),
        accessorKey: 'Organization.name',
        enableSorting: true,
        size: 300,
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
      {
        header: t('first_name'),
        accessorKey: 'User.firstName',
        enableSorting: true,
        size: 200,
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
      {
        header: t('last_name'),
        accessorKey: 'User.lastName',
        enableSorting: true,
        size: 200,
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
      {
        header: t('email'),
        accessorKey: 'User.email',
        enableSorting: true,
        size: 300,
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
    ],
    [t]
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
              data={data?.OrganizationAdmin || []}
              totalCount={data?.OrganizationAdmin_aggregate?.aggregate?.count || 0}
              pageIndex={pageIndex}
              onPageChange={setPageIndex}
              searchFilter={searchFilter}
              onSearchFilterChange={setSearchFilter}
              deleteMutation={DELETE_ORGANIZATION_ADMIN}
              deleteIdType="uuidString"
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
          </div>
        )}
      </div>
    </PageBlock>
  );
};

export default ManageAdminUsersContent;
