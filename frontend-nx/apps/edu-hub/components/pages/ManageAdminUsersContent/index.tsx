import { FC, ReactNode, useMemo, useCallback, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import { useTableGrid } from '../../common/TableGrid/hooks';
import CheckboxSelector from '../../inputs/CheckboxSelector';

import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  ORGANIZATION_ADMIN_LIST,
  DELETE_ORGANIZATION_ADMIN,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_EVENTS,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_COURSES,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_SETTINGS,
} from '../../../queries/organizationAdmin';
import { UPDATE_USER_ADMIN_STATUS, ADMIN_USERS } from '../../../queries/actions';
import { PageBlock } from '../../common/PageBlock';
import CommonPageHeader from '../../common/CommonPageHeader';
import { useIsAdmin } from '../../../hooks/authentication';
import { OrganizationAdminList_OrganizationAdmin } from '../../../queries/__generated__/OrganizationAdminList';

const ExpandableUserRow: FC<{
  row: OrganizationAdminList_OrganizationAdmin;
  isSuperAdmin: boolean;
  onAdminStatusChange: () => void;
}> = ({ row, isSuperAdmin, onAdminStatusChange }) => {
  const { t } = useTranslation('manageAdminUsers');
  const isAdmin = useIsAdmin();

  const [setAdminStatus] = useAdminMutation(UPDATE_USER_ADMIN_STATUS);

  const handleAdminToggle = async (checked: boolean) => {
    try {
      const response = await setAdminStatus({
        variables: {
          userId: row.id,
          isAdmin: checked,
        },
      });

      if (response.data?.success) {
        onAdminStatusChange();
      }
    } catch (error) {
      console.error('Error updating admin status:', error);
    }
  };

  return (
    <div>
      <div className="font-medium bg-edu-course-list grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))]">
        <div className="pl-3 col-span-3">
          <CheckboxSelector
            variant="eduhub"
            label={t('can_manage_events')}
            checked={row.canManageEvents}
            updateValueMutation={UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_EVENTS}
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
            identifierVariables={{ itemId: row.id }}
            refetchQueries={['GetAdminUsers']}
          />
        </div>
        <div className="pl-3 col-span-4">
          <CheckboxSelector
            variant="eduhub"
            label={t('can_manage_users_and_settings')}
            checked={row.canManageSettings}
            updateValueMutation={UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_SETTINGS}
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
  const { t } = useTranslation('manageAdminUsers');
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const [adminError, setAdminError] = useState<Error | null>(null);

  const { data: adminData } = useAdminQuery(ADMIN_USERS, {
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

  console.log(adminData);

  const { data, loading, error, pageIndex, setPageIndex, searchFilter, setSearchFilter, refetch } = useTableGrid({
    queryHook: useAdminQuery,
    query: ORGANIZATION_ADMIN_LIST,
    pageSize: 15,
    refetchFilter: (searchFilter) => ({
      _or: [
        { User: { lastName: { _ilike: `%${searchFilter}%` } } },
        { User: { firstName: { _ilike: `%${searchFilter}%` } } },
        { User: { email: { _ilike: `%${searchFilter}%` } } },
        { Organization: { name: { _ilike: `%${searchFilter}%` } } },
      ],
    }),
  });

  const columns = useMemo<ColumnDef<OrganizationAdminList_OrganizationAdmin>[]>(
    () => [
      {
        header: t('organization'),
        accessorKey: 'Organization.name',
        enableSorting: true,
        meta: {
          width: 3,
        },
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
      {
        header: t('first_name'),
        accessorKey: 'firstName',
        enableSorting: true,
        meta: {
          width: 2,
        },
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
      {
        header: t('last_name'),
        accessorKey: 'lastName',
        enableSorting: true,
        meta: {
          width: 2,
        },
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
      {
        header: t('email'),
        accessorKey: 'email',
        enableSorting: true,
        meta: {
          width: 3,
        },
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
              data={data?.User || []}
              totalCount={data?.User_aggregate?.aggregate?.count || 0}
              pageIndex={pageIndex}
              onPageChange={setPageIndex}
              searchFilter={searchFilter}
              onSearchFilterChange={setSearchFilter}
              deleteMutation={DELETE_ORGANIZATION_ADMIN}
              deleteIdType="uuidString"
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
