import { FC, ReactNode, useMemo, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';

import { useAdminQuery } from '../../../hooks/authedQuery';
import { USERS_BY_LAST_NAME, DELETE_USER } from '../../../queries/user';
import { UsersByLastName_User } from '../../../queries/__generated__/UsersByLastName';
import { PageBlock } from '../../common/PageBlock';
import CommonPageHeader from '../../common/CommonPageHeader';
import NavigationButton from '../../common/NavigationButton';
import { CreateUserDialog } from '../../common/dialogs/CreateUserDialog';

const ExpandableUserRow: FC<{ row: UsersByLastName_User }> = ({ row }) => {
  const t = useTranslations('manageUsers');
  return (
    <div>
      <div className="font-medium bg-edu-course-list grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))]">
        <div className="pl-3 col-span-3">
          <p className="text-gray-700 truncate font-medium">{`${t('occupation')}: ${
            row.occupation ? t(`profile:occupation.${row.occupation}`) : '-'
          }`}</p>
        </div>
        <div className="pl-3 col-span-3">
          <p className="text-gray-700 truncate font-medium">{`${t('organization')}: ${
            row.Organization?.name ? row.Organization.name : '-'
          }`}</p>
        </div>
        <div className="pl-3 col-span-3">
          <p className="text-gray-700 truncate font-medium">{`${t('matriculation_number')}: ${
            row.matriculationNumber ? `${row.matriculationNumber}` : '-'
          }`}</p>
        </div>
      </div>
      <div className="font-medium bg-edu-course-list flex py-4">
        <div className="pl-3">
          {row.CourseEnrollments.map((enrollment, index) => (
            <p key={index} className="text-gray-600 truncate text-sm">
              {enrollment.Course.title} ({enrollment.Course.Program.shortTitle}) - {enrollment.status}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

const ManageUsersContent: FC = () => {
  const t = useTranslations('manageUsers');
  const [pageSize, setPageSize] = useState(20);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); // Reset to first page when page size changes
  };

  const { data, loading, error, pageIndex, sorting, setPageIndex, setSorting, searchFilter, setSearchFilter, refetch } = useTableGrid({
    queryHook: useAdminQuery,
    query: USERS_BY_LAST_NAME,
    pageSize: pageSize,
    sortColumnMapper: (columnId) => {
      // Map table column IDs to GraphQL field names
      switch (columnId) {
        case 'firstName':
          return 'firstName';
        case 'lastName':
          return 'lastName';
        case 'email':
          return 'email';
        default:
          return null;
      }
    },
    refetchFilter: (searchFilter) => {
      const searchCondition = createMultiWordSearchCondition(searchFilter, ['lastName', 'firstName', 'email']);
      return {
        filter: searchCondition,
      };
    },
  });

  const columns = useMemo<ColumnDef<UsersByLastName_User>[]>(
    () => [
      {
        header: t('first_name'),
        accessorKey: 'firstName',
        enableSorting: true,
        size: 300,
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
      {
        header: t('last_name'),
        accessorKey: 'lastName',
        enableSorting: true,
        size: 300,
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
      {
        header: t('email'),
        accessorKey: 'email',
        enableSorting: true,
        size: 300,
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
    ],
    [t]
  );

  const generateDeletionConfirmation = useCallback(
    (row: UsersByLastName_User) => {
      return t('deletion_confirmation_question', { firstName: row.firstName, lastName: row.lastName });
    },
    [t]
  );

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">
        {loading && <Loading />}
        {!loading && !error && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <CommonPageHeader headline={t('headline')} />
              <NavigationButton href="/manage/admin-users" filled inverted>
                {t('manage_admins')}
              </NavigationButton>
            </div>
            <TableGrid
              columns={columns}
              data={data?.User || []}
              totalCount={data?.User_aggregate?.aggregate?.count || 0}
              pageIndex={pageIndex}
              onPageChange={setPageIndex}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              searchFilter={searchFilter}
              onSearchFilterChange={setSearchFilter}
              sorting={sorting}
              onSortingChange={setSorting}
              deleteMutation={DELETE_USER}
              deleteIdType="uuidString"
              error={error}
              loading={loading}
              refetchQueries={['UsersByLastName']}
              generateDeletionConfirmationQuestion={generateDeletionConfirmation}
              expandableRowComponent={({ row }) => <ExpandableUserRow row={row} />}
              addButtonText={t('create_user.button')}
              onAddButtonClick={() => setCreateUserDialogOpen(true)}
            />
          </div>
        )}
      </div>
      <CreateUserDialog
        open={createUserDialogOpen}
        onClose={() => setCreateUserDialogOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />
    </PageBlock>
  );
};

export default ManageUsersContent;
