import { FC, ReactNode, useMemo, useState, useEffect } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../common/TableGrid';
import Loading from '../common/Loading';

import { useAdminQuery } from '../../hooks/authedQuery';
import { USERS_BY_LAST_NAME } from '../../queries/user';
import {
  UsersByLastName,
  UsersByLastNameVariables,
  UsersByLastName_User,
} from '../../queries/__generated__/UsersByLastName';
import { PageBlock } from '../common/PageBlock';
import CommonPageHeader from '../common/CommonPageHeader';
import UserRow from './UserRow';

const ManageUsersContent: FC = () => {
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 5;

  const { data, loading, error, refetch } = useAdminQuery<UsersByLastName, UsersByLastNameVariables>(
    USERS_BY_LAST_NAME,
    {
      variables: {
        offset: pageIndex * pageSize,
        limit: pageSize,
      },
    }
  );

  useEffect(() => {
    refetch({ offset: pageIndex * pageSize, limit: pageSize });
  }, [pageIndex, pageSize, refetch]);

  const { t } = useTranslation('users');

  const columns = useMemo<ColumnDef<UsersByLastName_User>[]>(
    () => [
      {
        accessorKey: 'firstName',
        enableSorting: true,
        meta: {
          width: 3,
        },
        cell: ({ getValue, column, row }) => <div>{getValue<ReactNode>()}</div>,
      },
      {
        accessorKey: 'lastName',
        enableSorting: true,
        meta: {
          width: 3,
        },
        cell: ({ getValue, column, row }) => <div>{getValue<ReactNode>()}</div>,
      },
      {
        accessorKey: 'email',
        enableSorting: true,
        meta: {
          width: 3,
        },
        cell: ({ getValue, column, row }) => <div>{getValue<ReactNode>()}</div>,
      },
    ],
    []
  );

  // const onAddUserClick = async () => {
  //   console.log("add user");
  // };

  if (error) {
    console.log(error);
  }
  if (loading) {
    return <Loading />;
  }
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
              // deleteMutation={DELETE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE}
              refetchQueries={['AchievementDocumentationTemplates']}
              showDelete
              translationNamespace="users"
              enablePagination
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
              pages={Math.ceil(data.User_aggregate.aggregate.count / pageSize)}
              // addButtonText={t('addUserButtonText')}
              // onAddButtonClick={onAddUserClick}
              expandableRowComponent={({row}) => <UserRow row={row} />}
            />
          </div>
        )}
      </div>
    </PageBlock>
  );
};

export default ManageUsersContent;
