import { FC, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ColumnDef } from '@tanstack/react-table';
import { useDebouncedCallback } from 'use-debounce';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';

import { useAdminQuery } from '../../../hooks/authedQuery';
import { USERS_BY_LAST_NAME, DELETE_USER } from '../../../queries/user';
import {
  UsersByLastName,
  UsersByLastNameVariables,
  UsersByLastName_User,
} from '../../../queries/__generated__/UsersByLastName';
import { PageBlock } from '../../common/PageBlock';
import CommonPageHeader from '../../common/CommonPageHeader';

const ExpandableUserRow: FC<{ row: UsersByLastName_User }> = ({ row }) => {
  const { t } = useTranslation('common');
  return (
    <div>
      <div className="font-medium bg-edu-course-list grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))]">
        <div className="pl-3 col-span-3">
          <p className="text-gray-700 truncate font-medium">{`${t('common:status')}: ${
            row.employment ? t(`common:${row.employment}`) : '-'
          }`}</p>
        </div>
        <div className="pl-3 col-span-3">
          <p className="text-gray-700 truncate font-medium">{`${t('common:matriculation-number')}: ${
            row.matriculationNumber ? row.matriculationNumber : '-'
          }`}</p>
        </div>
        <div className="pl-3 col-span-3">
          <p className="text-gray-700 truncate font-medium">{`${t('common:university')}: ${
            row.university ? t(`common:${row.university}`) : '-'
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
  const [searchFilter, setSearchFilter] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 15;

  const userQueryResult = useAdminQuery<UsersByLastName, UsersByLastNameVariables>(USERS_BY_LAST_NAME, {
    variables: {
      offset: pageIndex * pageSize,
      limit: pageSize,
    },
  });

  const { data, loading, error, refetch } = userQueryResult;

  const debouncedRefetch = useDebouncedCallback(refetch, 1000);

  useEffect(() => {
    debouncedRefetch({
      offset: pageIndex * pageSize,
      limit: pageSize,
      filter: {
        _or: [
          { lastName: { _ilike: `%${searchFilter}%` } },
          { firstName: { _ilike: `%${searchFilter}%` } },
          { email: { _ilike: `%${searchFilter}%` } },
        ],
      },
    });
  }, [pageIndex, pageSize, debouncedRefetch, searchFilter]);

  const { t } = useTranslation('users');

  const columns = useMemo<ColumnDef<UsersByLastName_User>[]>(
    () => [
      {
        accessorKey: 'firstName',
        enableSorting: true,
        meta: {
          width: 3,
        },
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
      {
        accessorKey: 'lastName',
        enableSorting: true,
        meta: {
          width: 3,
        },
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
      {
        accessorKey: 'email',
        enableSorting: true,
        meta: {
          width: 3,
        },
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
    ],
    []
  );

  const generateDeletionConfirmation = useCallback(
    (row: UsersByLastName_User) => {
      return t('manageUsers:deletion_confirmation_question', { firstName: row.firstName, lastName: row.lastName });
    },
    [t]
  );

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">
        {loading && <Loading />}
        {error && <div>Es ist ein Fehler aufgetreten</div>}
        {!loading && !error && (
          <div>
            <CommonPageHeader headline={t('headline')} />
            <TableGrid
              columns={columns}
              data={data.User}
              error={error}
              loading={loading}
              deleteMutation={DELETE_USER}
              deleteIdType="uuidString"
              generateDeletionConfirmationQuestion={generateDeletionConfirmation}
              refetchQueries={['UsersByLastName']}
              showDelete
              translationNamespace="users"
              enablePagination
              pageIndex={pageIndex}
              searchFilter={searchFilter}
              setPageIndex={setPageIndex}
              setSearchFilter={setSearchFilter}
              pages={Math.ceil(data.User_aggregate.aggregate.count / pageSize)}
              // addButtonText={t('addUserButtonText')}
              // onAddButtonClick={onAddUserClick}
              expandableRowComponent={({ row }) => <ExpandableUserRow row={row} />}
            />
          </div>
        )}
      </div>
    </PageBlock>
  );
};

export default ManageUsersContent;
