import { FC, useMemo, useCallback, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import InputField from '../../forms/InputField';
import FileUpload from '../../forms/FileUpload';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';

import { useAdminQuery } from '../../../hooks/authedQuery';
import {
  ACHIEVEMENT_DOCUMENTATION_TEMPLATES,
  DELETE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE,
  INSERT_ACHIEVEMENT_DOCUMENTATION_TEMPLATE,
  UPDATE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE,
  UPDATE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE_TITLE,
} from '../../../queries/achievementDocumentationTemplate';
import { SAVE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE } from '../../../queries/actions';
import {
  SaveAchievementDocumentationTemplate,
  SaveAchievementDocumentationTemplateVariables,
} from '../../../queries/__generated__/SaveAchievementDocumentationTemplate';
import {
  AchievementDocumentationTemplates,
  AchievementDocumentationTemplates_AchievementDocumentationTemplate,
} from '../../../queries/__generated__/AchievementDocumentationTemplates';
import { PageBlock } from '../../common/PageBlock';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  InsertAchievementDocumentationTemplate,
  InsertAchievementDocumentationTemplateVariables,
} from '../../../queries/__generated__/InsertAchievementDocumentationTemplate';
import {
  UpdateAchievementDocumentationTemplate,
  UpdateAchievementDocumentationTemplateVariables,
} from '../../../queries/__generated__/UpdateAchievementDocumentationTemplate';
import FileDownload from '../../forms/FileDownload';
import { ApolloError } from '@apollo/client';

const ManageAchievementTemplatesContent: FC = () => {
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
          <InputField
            variant="material"
            type="input"
            value={getValue<string>()}
            label={t(column.columnDef.id)}
            updateValueMutation={UPDATE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE_TITLE}
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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onAddAchievementDocumentationTemplateClick = useCallback(async () => {
    try {
      await insertAchievementDocumentationTemplate({
        variables: {
          insertInput: { title: 'NEUES TEMPLATE', url: '/templates/default-achievement-template.txt' },
        },
      });
      refetch();
    } catch (error) {
      let errorMessage = '';
      if (error instanceof ApolloError) {
        console.error('Error adding achievement documentation template:', error);
        const rawErrorMessage = error.message;
        if (rawErrorMessage.includes('duplicate key value violates unique constraint')) {
          errorMessage = t('error.duplicate_element_name');
        } else {
          errorMessage = rawErrorMessage;
        }
      } else {
        errorMessage = t('error.unexpected');
      }
      setErrorMessage(errorMessage);
    }
  }, [insertAchievementDocumentationTemplate, refetch, t]);

  const handleCloseErrorDialog = useCallback(() => {
    setErrorMessage(null);
  }, []);

  if (error) {
    console.log(error);
  }
  if (loading) {
    return <Loading />;
  }
  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">
        <TableGrid
          columns={columns}
          data={data.AchievementDocumentationTemplate}
          deleteMutation={DELETE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE}
          error={error}
          loading={loading}
          refetchQueries={['AchievementDocumentationTemplates']}
          showDelete
          translationNamespace="manageAchievementTemplates"
          onAddButtonClick={onAddAchievementDocumentationTemplateClick}
          addButtonText={t('addUserAchievementDocumentationTemplateText')}
        />
        <ErrorMessageDialog errorMessage={errorMessage} open={!!errorMessage} onClose={handleCloseErrorDialog} />
      </div>
    </PageBlock>
  );
};

export default ManageAchievementTemplatesContent;
