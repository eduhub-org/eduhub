import { FC, useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../common/TableGrid';
import Loading from '../common/Loading';
import TextFieldEditor from '../common/TextFieldEditor';

import { useAdminQuery } from '../../hooks/authedQuery';
import {
  ACHIEVEMENT_DOCUMENTATION_TEMPLATES,
  DELETE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE,
  INSERT_ACHIEVEMENT_DOCUMENTATION_TEMPLATE,
  UPDATE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE,
  UPDATE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE_TITLE,
} from '../../queries/achievementDocumentationTemplate';
import {
  AchievementDocumentationTemplates,
  AchievementDocumentationTemplates_AchievementDocumentationTemplate,
} from '../../queries/__generated__/AchievementDocumentationTemplates';
import { PageBlock } from '../common/PageBlock';
import EhAddButton from '../common/EhAddButton';
import { useAdminMutation } from '../../hooks/authedMutation';
import {
  InsertAchievementDocumentationTemplate,
  InsertAchievementDocumentationTemplateVariables,
} from '../../queries/__generated__/InsertAchievementDocumentationTemplate';

const ManageAchievementTemplatesContent: FC = () => {
  const { data, loading, error, refetch } = useAdminQuery<AchievementDocumentationTemplates>(
    ACHIEVEMENT_DOCUMENTATION_TEMPLATES
  );
  const [insertAchievementDocumentationTemplate] = useAdminMutation<
    InsertAchievementDocumentationTemplate,
    InsertAchievementDocumentationTemplateVariables
  >(INSERT_ACHIEVEMENT_DOCUMENTATION_TEMPLATE);

  const { t } = useTranslation('manageAchievementTemplates');

  const columns = useMemo<ColumnDef<AchievementDocumentationTemplates_AchievementDocumentationTemplate>[]>(
    () => [
      {
        accessorKey: 'title',
        enableSorting: true,
        meta: {
          width: 3,
        },
        cell: ({ getValue, column, row }) => (
          <TextFieldEditor
            currentText={getValue<string>()}
            label={t(column.columnDef.id)}
            updateTextMutation={UPDATE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE_TITLE}
            itemId={row.original.id}
            placeholder={t(column.columnDef.id)}
            refetchQueries={['AchievementDocumentationTemplates']}
          />
        ),
      },
      {
        accessorKey: 'url',
        accessorFn: (row) => ({ title: row.title, url: row.url }),
        className: '',
        meta: {
          width: 3,
        },
        cell: ({ getValue }) => (
          <div>
            <a target="_blank" rel="noreferrer" href={getValue<{ title: string; url: string }>().url}>
              Download
            </a>
          </div>
        ),
      },
    ],
    []
  );

  const onAddAchievementDocumentationTemplateClick = async () => {
    await insertAchievementDocumentationTemplate({
      variables: {
        insertInput: { title: 'NEUES TEMPLATE', url: '/templates/default-achievement-template.txt' },
      },
    });
    refetch();
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
            <EhAddButton
              buttonClickCallBack={onAddAchievementDocumentationTemplateClick}
              text={t('addUserAchievementDocumentationTemplateText')}
            />
            <TableGrid
              columns={columns}
              data={data.AchievementDocumentationTemplate}
              showDelete
              translationNamespace="manageAchievementTemplates"
            />
          </div>
        )}
      </div>
    </PageBlock>
  );
};

export default ManageAchievementTemplatesContent;
