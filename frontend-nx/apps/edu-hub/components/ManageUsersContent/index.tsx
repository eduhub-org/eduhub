import { FC, ReactNode, useMemo, useState, useEffect } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../common/TableGrid';
import Loading from '../common/Loading';
import TextFieldEditor from '../common/TextFieldEditor';
import FileUpload from '../common/forms/FileUpload';

import { useAdminQuery } from '../../hooks/authedQuery';
import { USERS_BY_LAST_NAME } from '../../queries/user';
import { SAVE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE } from '../../queries/actions';
import {
  UsersByLastName,
  UsersByLastNameVariables,
  UsersByLastName_User,
} from '../../queries/__generated__/UsersByLastName';
import { PageBlock } from '../common/PageBlock';
import EhAddButton from '../common/EhAddButton';
import { useAdminMutation } from '../../hooks/authedMutation';

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

  const { t } = useTranslation('manageAchievementTemplates');

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

  const onAddUserClick = async () => {
    console.log("add user");
  };

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
              addButtonText={t('addUserAchievementDocumentationTemplateText')}
              onAddButtonClick={onAddUserClick}
              expandableRowComponent={({ row }) => (
                <div>
                  <div className="font-medium bg-edu-course-list h-12 flex">
                    <td className="pl-5">
                      <p className="text-gray-700 truncate font-medium max-w-xs">{`${t('common:status')}: ${
                        row.employment ? t(`common:${row.employment}`) : '-'
                      }`}</p>
                    </td>
                    <td className="pl-5">
                      <p className="text-gray-700 truncate font-medium max-w-xs">{`${t(
                        'common:matriculation-number'
                      )}: ${row.matriculationNumber ? row.matriculationNumber : '-'}`}</p>
                    </td>
                    <td className="pl-5">
                      <p className="text-gray-700 truncate font-medium max-w-xs">{`${t('common:university')}: ${
                        row.university ? t(`common:${row.university}`) : '-'
                      }`}</p>
                    </td>
                  </div>
                  <div className="font-medium bg-edu-course-list h-12 flex">
                    <td className="pl-5" colSpan={3}>
                      {row.CourseEnrollments.map((enrollment, index) => (
                        <p key={index} className="text-gray-600 truncate text-sm max-w-xs">
                          {enrollment.Course.title} ({enrollment.Course.Program.shortTitle}) - {enrollment.status}
                        </p>
                      ))}
                    </td>
                  </div>
                </div>
              )}
            />
          </div>
        )}
      </div>
    </PageBlock>
  );
};

export default ManageUsersContent;
