import { FC, useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../common/TableGrid';
import Loading from '../common/Loading';
import TextFieldEditor from '../common/TextFieldEditor';
import FileUpload from '../common/forms/FileUpload';

import { useAdminQuery } from '../../hooks/authedQuery';
import {
  ACHIEVEMENT_DOCUMENTATION_TEMPLATES,
  DELETE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE,
  INSERT_ACHIEVEMENT_DOCUMENTATION_TEMPLATE,
  UPDATE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE,
  UPDATE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE_TITLE,
} from '../../queries/achievementDocumentationTemplate';
import { SAVE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE } from '../../queries/actions';
import {
  SaveAchievementDocumentationTemplate,
  SaveAchievementDocumentationTemplateVariables,
} from '../../queries/__generated__/SaveAchievementDocumentationTemplate';
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
import {
  UpdateAchievementDocumentationTemplate,
  UpdateAchievementDocumentationTemplateVariables,
} from '../../queries/__generated__/UpdateAchievementDocumentationTemplate';
import FileDownload from '../common/forms/FileDownload';

const ManageUsersContent: FC = () => {
  const { data, loading, error, refetch } = useAdminQuery<AchievementDocumentationTemplates>(
    ACHIEVEMENT_DOCUMENTATION_TEMPLATES
  );
  const [insertAchievementDocumentationTemplate] = useAdminMutation<
    InsertAchievementDocumentationTemplate,
    InsertAchievementDocumentationTemplateVariables
  >(INSERT_ACHIEVEMENT_DOCUMENTATION_TEMPLATE);

  const [updateAchievementDocumentationTemplate] = useAdminMutation<
    UpdateAchievementDocumentationTemplate,
    UpdateAchievementDocumentationTemplateVariables
  >(UPDATE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE);

  const [saveAchievementDocumentationTemplate] = useAdminMutation<
    SaveAchievementDocumentationTemplate,
    SaveAchievementDocumentationTemplateVariables
  >(SAVE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE);

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
        accessorFn: (row) => ({ url: row.url }),
        header: 'Download',
        meta: {
          width: 3,
        },
        cell: ({ getValue }) => {
          const { url } = getValue<{ url: string }>();
          const filename = url.split('/').pop(); // Extracts the last segment of the URL
          return (
            <div className="flex items-center">
              <FileDownload filePath={url} />
              <span className="ml-2">{filename}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'upload',
        accessorFn: (row) => row.id,
        meta: {
          width: 3,
        },
        cell: ({ getValue, row }) => (
          <FileUpload
            id={row.original.id}
            submitMutation={updateAchievementDocumentationTemplate}
            uploadMutation={saveAchievementDocumentationTemplate}
            uploadVariables={{ achievementDocumentationTemplateId: getValue() }}
            submitVariables={{ itemId: getValue(), text: row.original.title }}
            refetchQueries={['AchievementDocumentationTemplates']}
          />
        ),
      },
    ],
    [t, saveAchievementDocumentationTemplate, updateAchievementDocumentationTemplate]
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
            <div className="text-white">
              <EhAddButton
                buttonClickCallBack={onAddAchievementDocumentationTemplateClick}
                text={t('addUserAchievementDocumentationTemplateText')}
              />
            </div>
            <TableGrid
              columns={columns}
              data={data.AchievementDocumentationTemplate}
              deleteMutation={DELETE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE}
              refetchQueries={['AchievementDocumentationTemplates']}
              showDelete
              translationNamespace="manageAchievementTemplates"
            />
          </div>
        )}
      </div>
    </PageBlock>
  );
};

export default ManageUsersContent;
