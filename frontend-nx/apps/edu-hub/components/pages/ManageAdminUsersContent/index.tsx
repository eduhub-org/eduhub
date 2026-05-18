import { FC, ReactNode, useMemo, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { useSession } from 'next-auth/react';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import CheckboxSelector from '../../inputs/CheckboxSelector';

import { useRoleQuery, useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  ORGANIZATION_ADMIN_LIST,
  DELETE_ORGANIZATION_ADMIN,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_EVENTS,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_COURSES,
  UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_SETTINGS,
  MY_MANAGEABLE_ORGANIZATION_ADMINS,
} from '../../../queries/organizationAdmin';
import { UPDATE_USER_ADMIN_STATUS, ADMIN_USERS } from '../../../queries/actions';
import { PageBlock } from '../../common/PageBlock';
import CommonPageHeader from '../../common/CommonPageHeader';
import { useIsAdmin } from '../../../hooks/authentication';
import { useManageableOrganizationIds } from '../../../hooks/useOrganizationAdminAccess';
import { OrganizationAdminList_OrganizationAdmin } from '../../../queries/__generated__/OrganizationAdminList';
import { AddOrganizationAdminDialog } from './AddOrganizationAdminDialog';
import { ORGANIZATION_LIST } from '../../../queries/organization';

const ExpandableUserRow: FC<{
  row: OrganizationAdminList_OrganizationAdmin;
  isSuperAdmin: boolean;
  isEduHubAdmin: boolean;
  onAdminStatusChange: () => void;
}> = ({ row, isSuperAdmin, isEduHubAdmin, onAdminStatusChange }) => {
  const t = useTranslations('manageAdminUsers');

  const [setAdminStatus] = useAdminMutation(UPDATE_USER_ADMIN_STATUS);

  const handleAdminToggle = async (checked: boolean) => {
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
  };

  return (
    <div>
      <div className="font-medium bg-fill-primary text-label-primary light grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))]">
        <div className="pl-3 col-span-3">
          <CheckboxSelector
            variant="eduhub"
            label={t('can_manage_events')}
            checked={row.canManageEvents}
            updateValueMutation={UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_EVENTS}
            identifierVariables={{ id: row.id }}
            refetchQueries={['OrganizationAdminList', 'AdminUsers']}
          />
        </div>
        <div className="pl-3 col-span-3">
          <CheckboxSelector
            variant="eduhub"
            label={t('can_manage_courses')}
            checked={row.canManageCourses}
            updateValueMutation={UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_COURSES}
            identifierVariables={{ id: row.id }}
            refetchQueries={['OrganizationAdminList', 'AdminUsers']}
          />
        </div>
        <div className="pl-3 col-span-4">
          <CheckboxSelector
            variant="eduhub"
            label={t('can_manage_users_and_settings')}
            checked={row.canManageSettings}
            updateValueMutation={UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_SETTINGS}
            identifierVariables={{ id: row.id }}
            refetchQueries={['OrganizationAdminList', 'AdminUsers']}
          />
        </div>
      </div>
      {isEduHubAdmin && (
        <div className="pl-3 col-span-3 mt-2">
          <CheckboxSelector
            variant="eduhub"
            label={t('is_super_admin')}
            checked={isSuperAdmin}
            onValueUpdated={handleAdminToggle}
            refetchQueries={['OrganizationAdminList', 'AdminUsers']}
          />
        </div>
      )}
    </div>
  );
};

const ManageAdminUsersContent: FC = () => {
  const t = useTranslations('manageAdminUsers');
  const isEduHubAdmin = useIsAdmin();
  const manageableOrganizationIds = useManageableOrganizationIds();
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const [adminError, setAdminError] = useState<Error | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { data: sessionData } = useSession();
  const userId = sessionData?.profile?.['https://hasura.io/jwt/claims']?.['x-hasura-user-id'] as string | undefined;

  useAdminQuery(ADMIN_USERS, {
    skip: !isEduHubAdmin,
    onCompleted: (data) => {
      if (data?.getAdminUsers?.success) {
        setAdminUserIds(data.getAdminUsers.adminUserIds ?? []);
      }
    },
    onError: (error) => {
      console.error('Error fetching admin users:', error);
      setAdminError(error);
    },
  });

  const { data: myOrganizationsData } = useRoleQuery(MY_MANAGEABLE_ORGANIZATION_ADMINS, {
    variables: { userId },
    skip: isEduHubAdmin || !userId,
  });

  const { data: allOrganizationsData } = useAdminQuery(ORGANIZATION_LIST, {
    variables: { limit: 500, offset: 0 },
    skip: !isEduHubAdmin,
  });

  const organizationOptions = useMemo(() => {
    if (isEduHubAdmin) {
      return (
        allOrganizationsData?.Organization?.map((org) => ({
          id: org.id,
          name: org.name,
        })) ?? []
      );
    }

    return (
      myOrganizationsData?.OrganizationAdmin?.map((admin) => ({
        id: admin.Organization?.id ?? admin.organizationId,
        name: admin.Organization?.name ?? String(admin.organizationId),
      })).filter((org): org is { id: number; name: string } => org.id != null) ?? []
    );
  }, [isEduHubAdmin, allOrganizationsData, myOrganizationsData]);

  const { data, loading, error, pageIndex, setPageIndex, searchFilter, setSearchFilter, refetch } = useTableGrid({
    queryHook: useRoleQuery,
    query: ORGANIZATION_ADMIN_LIST,
    pageSize: 15,
    refetchFilter: (searchFilterValue) => {
      const searchCondition = createMultiWordSearchCondition(searchFilterValue, [
        'User.lastName',
        'User.firstName',
        'User.email',
        'Organization.name',
      ]);
      const filters = [];
      if (!isEduHubAdmin && manageableOrganizationIds.length > 0) {
        filters.push({ organizationId: { _in: manageableOrganizationIds } });
      }
      if (Object.keys(searchCondition).length > 0) {
        filters.push(searchCondition);
      }
      return {
        filter: filters.length > 0 ? { _and: filters } : {},
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
        {adminError && <p className="text-red-500 p-4">{t('error_loading_admin_users')}</p>}
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
              deleteIdType="number"
              error={error}
              loading={loading}
              refetchQueries={['OrganizationAdminList', 'AdminUsers', 'MyManageableOrganizationAdmins']}
              generateDeletionConfirmationQuestion={generateDeletionConfirmation}
              addButtonText={t('add_admin.button')}
              onAddButtonClick={() => setAddDialogOpen(true)}
              expandableRowComponent={({ row }) => (
                <ExpandableUserRow
                  row={row}
                  isSuperAdmin={row.User?.id ? adminUserIds.includes(row.User.id) : false}
                  isEduHubAdmin={isEduHubAdmin}
                  onAdminStatusChange={() => refetch()}
                />
              )}
            />
          </div>
        )}
      </div>

      <AddOrganizationAdminDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={() => refetch()}
        organizationOptions={organizationOptions}
        defaultOrganizationId={organizationOptions.length === 1 ? organizationOptions[0].id : undefined}
      />
    </PageBlock>
  );
};

export default ManageAdminUsersContent;
