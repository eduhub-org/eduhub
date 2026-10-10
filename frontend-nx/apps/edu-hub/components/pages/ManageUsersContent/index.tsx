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
import { ImpersonateUserButton } from './ImpersonateUserButton';
import { Card } from '../../common/Card';
import { EnrollmentHistory } from '../../common/EnrollmentHistory';

const ProfileField: FC<{ label: string; value?: ReactNode }> = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-xs text-label-secondary">{label}</dt>
    <dd className="text-sm text-label-primary break-words">{value || '-'}</dd>
  </div>
);

const ExpandableUserRow: FC<{ row: UsersByLastName_User }> = ({ row }) => {
  const t = useTranslations('manageUsers');
  const tProfile = useTranslations('profile');
  const tHistory = useTranslations('enrollmentHistory');
  return (
    <div className="w-full p-3 md:p-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(14rem,1fr)_minmax(0,2fr)]">
      <Card title={t('expanded.profile')} className="min-w-0">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1">
          <ProfileField label={t('email')} value={row.email} />
          <ProfileField
            label={t('occupation')}
            value={row.occupation ? tProfile(`occupation.${row.occupation}`) : null}
          />
          <ProfileField label={t('organization')} value={row.Organization?.name} />
          <ProfileField label={t('matriculation_number')} value={row.matriculationNumber} />
        </dl>
        {/* The table hides this column below lg, so it lives here as well. */}
        <div className="mt-4 lg:hidden">
          <ImpersonateUserButton userId={row.id} />
        </div>
      </Card>
      <Card title={t('expanded.history')} helpText={tHistory('legend')} className="min-w-0">
        <EnrollmentHistory enrollments={row.CourseEnrollments} showLabel={false} />
      </Card>
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

  const { data, loading, initialLoading, error, pageIndex, sorting, setPageIndex, setSorting, searchFilter, setSearchFilter, refetch } = useTableGrid({
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
        size: 160,
        cell: ({ getValue }) => <div className="truncate">{getValue<ReactNode>()}</div>,
      },
      {
        header: t('last_name'),
        accessorKey: 'lastName',
        enableSorting: true,
        size: 160,
        cell: ({ getValue }) => <div className="truncate">{getValue<ReactNode>()}</div>,
      },
      {
        header: t('email'),
        accessorKey: 'email',
        enableSorting: true,
        size: 240,
        cell: ({ getValue }) => (
          <div className="truncate" title={getValue<string>()}>
            {getValue<ReactNode>()}
          </div>
        ),
      },
      {
        id: 'impersonate',
        header: '',
        size: 170,
        enableSorting: false,
        meta: { hideBelow: 'lg' },
        cell: ({ row }) => <ImpersonateUserButton userId={row.original.id} />,
      },
    ],
    [t]
  );

  // Phones: name and email; everything else is in the expandable part.
  const renderMobileRow = useCallback(
    (user: UsersByLastName_User) => (
      <div className="min-w-0">
        <div className="font-medium text-label-primary break-words">
          {user.firstName} {user.lastName}
        </div>
        <div className="text-sm text-label-secondary break-all">{user.email}</div>
      </div>
    ),
    []
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
        {initialLoading && <Loading />}
        {!initialLoading && !error && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <CommonPageHeader headline={t('headline')} />
              <NavigationButton href="/manage/settings/access" filled inverted>
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
              renderMobileRow={renderMobileRow}
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
