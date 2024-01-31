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

  // const onAddAchievementDocumentationTemplateClick = async () => {
  //   await insertAchievementDocumentationTemplate({
  //     variables: {
  //       insertInput: { title: 'NEUES TEMPLATE', url: '/templates/default-achievement-template.txt' },
  //     },
  //   });
  //   refetch();
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
            {/* <div className="text-white">
              <EhAddButton
                buttonClickCallBack={onAddAchievementDocumentationTemplateClick}
                text={t('addUserAchievementDocumentationTemplateText')}
              />
            </div> */}
            <TableGrid
              columns={columns}
              data={data.User}
              // deleteMutation={DELETE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE}
              refetchQueries={['AchievementDocumentationTemplates']}
              showDelete
              translationNamespace="manageAchievementTemplates"
              enablePagination
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
              pages={data.User_aggregate.aggregate.count}
            />
          </div>
        )}
      </div>
    </PageBlock>
  );
};

export default ManageUsersContent;
