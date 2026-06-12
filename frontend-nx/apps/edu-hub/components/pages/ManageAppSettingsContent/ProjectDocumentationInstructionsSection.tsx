import { FC, useCallback, useId, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ApolloError, MutationFunction } from '@apollo/client';
import { ColumnDef } from '@tanstack/react-table';
import { Chip, IconButton, Tooltip } from '@mui/material';
import { MdCheckCircle, MdDelete, MdStarOutline } from 'react-icons/md';
import { useFileUploader } from '../../../hooks/fileUpload';

import TableGrid from '../../common/TableGrid';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import InputField from '../../inputs/InputField';
import FileUpload from '../../inputs/FileUpload';
import FileDownload from '../../inputs/FileDownload';
import DropDownSelector from '../../inputs/DropDownSelector';
import { DialogShell } from '../../common/dialogs/DialogShell';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
import { Button } from '../../common/Button';

import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { PROJECT_TYPES } from '../../../queries/project';
import {
  PROJECT_DOCUMENTATION_INSTRUCTIONS_TABLE,
  INSERT_PROJECT_DOCUMENTATION_INSTRUCTION,
  UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION_TITLE,
  UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION_URL,
  DELETE_PROJECT_DOCUMENTATION_INSTRUCTION,
  SET_PROJECT_DOCUMENTATION_INSTRUCTION_DEFAULT,
  SAVE_PROJECT_DOCUMENTATION_INSTRUCTION,
} from '../../../queries/projectDocumentationInstruction';
import { ProjectTypes } from '../../../queries/__generated__/ProjectTypes';
import {
  ProjectDocumentationInstructionsTable_ProjectDocumentationInstruction,
} from '../../../queries/__generated__/ProjectDocumentationInstructionsTable';
import {
  InsertProjectDocumentationInstruction,
  InsertProjectDocumentationInstructionVariables,
} from '../../../queries/__generated__/InsertProjectDocumentationInstruction';
import {
  UpdateProjectDocumentationInstructionUrl,
  UpdateProjectDocumentationInstructionUrlVariables,
} from '../../../queries/__generated__/UpdateProjectDocumentationInstructionUrl';
import {
  SaveProjectDocumentationInstruction,
  SaveProjectDocumentationInstructionVariables,
} from '../../../queries/__generated__/SaveProjectDocumentationInstruction';
import {
  SetProjectDocumentationInstructionDefault,
  SetProjectDocumentationInstructionDefaultVariables,
} from '../../../queries/__generated__/SetProjectDocumentationInstructionDefault';
import {
  DeleteProjectDocumentationInstruction,
  DeleteProjectDocumentationInstructionVariables,
} from '../../../queries/__generated__/DeleteProjectDocumentationInstruction';
import { handleForeignKeyError } from '../../../helpers/errorHandling';

const REFETCH_QUERIES = ['ProjectDocumentationInstructionsTable'];

type InstructionRow = ProjectDocumentationInstructionsTable_ProjectDocumentationInstruction;

const ProjectDocumentationInstructionsSection: FC = () => {
  const t = useTranslations('manageAppSettings.projectDocumentationInstructions');
  const tCommon = useTranslations('common');
  const tCourse = useTranslations('course');

  const pageSize = 20;

  const {
    data,
    loading,
    error,
    pageIndex,
    setPageIndex,
    searchFilter,
    setSearchFilter,
    refetch,
  } = useTableGrid({
    queryHook: useAdminQuery,
    query: PROJECT_DOCUMENTATION_INSTRUCTIONS_TABLE,
    pageSize,
    refetchFilter: (searchFilter) => ({
      filter: createMultiWordSearchCondition(searchFilter, ['title']),
    }),
  });

  const { data: projectTypesData } = useAdminQuery<ProjectTypes>(PROJECT_TYPES);
  const projectTypeOptions = useMemo(
    () =>
      (projectTypesData?.ProjectType ?? []).map((pt) => ({
        value: pt.value,
        label: tCourse(`projects.type_label.${pt.value}` as never),
      })),
    [projectTypesData?.ProjectType, tCourse]
  );

  const [insertInstruction] = useAdminMutation<
    InsertProjectDocumentationInstruction,
    InsertProjectDocumentationInstructionVariables
  >(INSERT_PROJECT_DOCUMENTATION_INSTRUCTION);

  const [updateInstructionUrl] = useAdminMutation<
    UpdateProjectDocumentationInstructionUrl,
    UpdateProjectDocumentationInstructionUrlVariables
  >(UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION_URL);

  const [saveInstructionFile] = useAdminMutation<
    SaveProjectDocumentationInstruction,
    SaveProjectDocumentationInstructionVariables
  >(SAVE_PROJECT_DOCUMENTATION_INSTRUCTION);

  const [setInstructionDefault, { loading: settingDefault }] = useAdminMutation<
    SetProjectDocumentationInstructionDefault,
    SetProjectDocumentationInstructionDefaultVariables
  >(SET_PROJECT_DOCUMENTATION_INSTRUCTION_DEFAULT, {
    refetchQueries: REFETCH_QUERIES,
  });

  const [deleteInstruction, { loading: deleting }] = useAdminMutation<
    DeleteProjectDocumentationInstruction,
    DeleteProjectDocumentationInstructionVariables
  >(DELETE_PROJECT_DOCUMENTATION_INSTRUCTION, {
    refetchQueries: REFETCH_QUERIES,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<InstructionRow | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addType, setAddType] = useState<string>('');
  const [addPdfFile, setAddPdfFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const addPdfInputId = useId();
  const addPdfInputRef = useRef<HTMLInputElement>(null);
  const { getFileBase64, isLoading: pdfEncoding } = useFileUploader();

  const resetAddForm = useCallback(() => {
    setAddTitle('');
    setAddType(projectTypeOptions[0]?.value ?? '');
    setAddPdfFile(null);
    if (addPdfInputRef.current) {
      addPdfInputRef.current.value = '';
    }
  }, [projectTypeOptions]);

  const openAddDialog = useCallback(() => {
    resetAddForm();
    setAddOpen(true);
  }, [resetAddForm]);

  const closeAddDialog = useCallback(() => {
    if (adding) return;
    setAddOpen(false);
    resetAddForm();
  }, [adding, resetAddForm]);

  const handleAddPdfChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAddPdfFile(file);
  }, []);

  const canSubmitAdd =
    Boolean(addTitle.trim()) && Boolean(addType) && addPdfFile !== null && !adding && !pdfEncoding;

  const handleAddSubmit = useCallback(async () => {
    const titleTrimmed = addTitle.trim();
    if (!titleTrimmed || !addType || !addPdfFile) return;

    setAdding(true);
    let createdId: number | null = null;

    try {
      const insertResult = await insertInstruction({
        variables: { title: titleTrimmed, projectTypeValue: addType },
      });
      createdId = insertResult.data?.insert_ProjectDocumentationInstruction_one?.id ?? null;
      if (createdId == null) {
        setErrorMessage(t('error.create_failed'));
        return;
      }

      const base64File = await getFileBase64(addPdfFile);
      if (!base64File) {
        await deleteInstruction({ variables: { id: createdId } });
        setErrorMessage(t('error.pdf_upload_failed'));
        return;
      }

      const uploadResult = await saveInstructionFile({
        variables: {
          base64File,
          fileName: addPdfFile.name,
          projectDocumentationInstructionId: createdId,
        },
      });
      const uploadPayload = uploadResult.data?.saveProjectDocumentationInstruction;
      if (!uploadPayload?.success || !uploadPayload.filePath) {
        await deleteInstruction({ variables: { id: createdId } });
        setErrorMessage(uploadPayload?.error ?? t('error.pdf_upload_failed'));
        return;
      }

      await updateInstructionUrl({
        variables: { itemId: createdId, url: uploadPayload.filePath },
      });

      setAddOpen(false);
      resetAddForm();
      refetch();
    } catch (err) {
      if (createdId != null) {
        try {
          await deleteInstruction({ variables: { id: createdId } });
        } catch {
          // Best-effort rollback; surface original error below.
        }
      }
      if (err instanceof ApolloError) {
        const raw = err.message;
        setErrorMessage(
          raw.includes('duplicate key value')
            ? t('error.duplicate_title')
            : raw
        );
      } else {
        setErrorMessage(t('error.pdf_upload_failed'));
      }
    } finally {
      setAdding(false);
    }
  }, [
    addTitle,
    addType,
    addPdfFile,
    insertInstruction,
    deleteInstruction,
    getFileBase64,
    saveInstructionFile,
    updateInstructionUrl,
    refetch,
    resetAddForm,
    t,
  ]);

  const handleSetDefault = useCallback(
    async (row: InstructionRow) => {
      try {
        const result = await setInstructionDefault({
          variables: { instructionId: row.id },
        });
        const payload = result.data?.setProjectDocumentationInstructionDefault;
        if (payload && !payload.success) {
          setErrorMessage(payload.error || t('error.set_default_failed'));
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : tCommon('error'));
      }
    },
    [setInstructionDefault, t, tCommon]
  );

  const performDelete = useCallback(async () => {
    if (!pendingDelete) return;
    try {
      await deleteInstruction({ variables: { id: pendingDelete.id } });
      setPendingDelete(null);
    } catch (err) {
      let message: string;
      if (err instanceof ApolloError) {
        message = handleForeignKeyError(err, tCommon);
      } else if (err instanceof Error) {
        message = err.message;
      } else {
        message = tCommon('error');
      }
      setErrorMessage(message);
      setPendingDelete(null);
    }
  }, [deleteInstruction, pendingDelete, tCommon]);

  const columns = useMemo<ColumnDef<InstructionRow>[]>(
    () => [
      {
        accessorKey: 'projectTypeValue',
        header: t('column.project_type'),
        size: 220,
        cell: ({ getValue }) => (
          <span className="text-sm text-label-primary">
            {tCourse(`projects.type_label.${getValue<string>()}` as never)}
          </span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('column.title'),
        size: 320,
        minSize: 240,
        cell: ({ getValue, row }) => (
          <InputField
            variant="material"
            type="input"
            value={getValue<string>()}
            label={t('column.title')}
            updateValueMutation={UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION_TITLE}
            itemId={row.original.id}
            placeholder={t('column.title')}
            refetchQueries={REFETCH_QUERIES}
          />
        ),
      },
      {
        accessorKey: 'url',
        header: t('column.pdf'),
        size: 260,
        cell: ({ row }) => {
          const url = row.original.url?.trim();
          const filename = url ? url.split('/').pop() : null;
          return (
            <div className="flex items-center gap-2 min-w-0">
              {url ? (
                <>
                  <FileDownload filePath={url} />
                  <span className="truncate text-xs text-label-secondary">{filename}</span>
                </>
              ) : (
                <span className="text-xs text-amber-700 italic">{t('pdf_not_uploaded')}</span>
              )}
            </div>
          );
        },
      },
      {
        id: 'upload',
        header: t('column.upload'),
        size: 90,
        cell: ({ row }) => (
          <FileUpload
            id={String(row.original.id)}
            uploadMutation={saveInstructionFile as MutationFunction}
            submitMutation={updateInstructionUrl as MutationFunction}
            uploadVariables={{ projectDocumentationInstructionId: row.original.id }}
            submitVariables={{ itemId: row.original.id }}
            refetchQueries={REFETCH_QUERIES}
          />
        ),
      },
      {
        id: 'default',
        header: t('column.default'),
        size: 160,
        cell: ({ row }) => {
          const hasPdf = Boolean(row.original.url?.trim());
          if (row.original.isDefault) {
            return (
              <Chip
                icon={<MdCheckCircle />}
                label={t('default_badge')}
                size="small"
                color="success"
                variant="outlined"
              />
            );
          }
          return (
            <Tooltip
              title={hasPdf ? t('set_default_tooltip') : t('set_default_disabled_no_pdf_tooltip')}
            >
              <span>
                <Button
                  onClick={() => handleSetDefault(row.original)}
                  disabled={settingDefault || !hasPdf}
                >
                  <MdStarOutline className="inline mr-1" />
                  {t('set_default_button')}
                </Button>
              </span>
            </Tooltip>
          );
        },
      },
      {
        id: 'actions',
        header: t('column.actions'),
        size: 90,
        cell: ({ row }) => {
          const blocked = row.original.isDefault;
          return (
            <Tooltip
              title={
                blocked
                  ? t('delete_disabled_default_tooltip')
                  : t('delete_tooltip')
              }
            >
              <span>
                <IconButton
                  size="small"
                  aria-label={t('delete_tooltip')}
                  onClick={() => setPendingDelete(row.original)}
                  disabled={blocked || deleting}
                  sx={{
                    backgroundColor: 'transparent !important',
                    padding: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 0, 0, 0.1) !important',
                    },
                  }}
                >
                  <MdDelete size="1.25em" color={blocked ? 'gray' : 'red'} />
                </IconButton>
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [
      t,
      tCourse,
      saveInstructionFile,
      updateInstructionUrl,
      handleSetDefault,
      settingDefault,
      deleting,
    ]
  );

  return (
    <div className="mt-8">
      <label className="text-xs uppercase tracking-widest font-medium text-gray-400 mb-4 block">
        {t('section_label')}
      </label>
      <p className="text-sm text-label-secondary mb-4">{t('section_help')}</p>

      <TableGrid
        columns={columns}
        data={data?.ProjectDocumentationInstruction || []}
        totalCount={data?.ProjectDocumentationInstruction_aggregate?.aggregate?.count ?? 0}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        pageSize={pageSize}
        searchFilter={searchFilter}
        onSearchFilterChange={setSearchFilter}
        error={error}
        loading={loading}
        refetchQueries={REFETCH_QUERIES}
        onAddButtonClick={openAddDialog}
        addButtonText={t('add_button')}
      />

      <DialogShell
        open={addOpen}
        onClose={closeAddDialog}
        title={t('add_dialog.title')}
        ariaLabelledBy="add-project-documentation-instruction"
        maxWidth="sm"
        actions={
          <div className="flex justify-end gap-2">
            <Button onClick={closeAddDialog} disabled={adding}>
              {tCommon('cancel')}
            </Button>
            <Button filled onClick={handleAddSubmit} disabled={!canSubmitAdd}>
              {t('add_dialog.submit')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium mb-1">
              {t('add_dialog.title_label')}
            </span>
            <input
              type="text"
              className="w-full border border-border-primary rounded px-3 py-2"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              placeholder={t('add_dialog.title_placeholder')}
              maxLength={200}
              disabled={adding}
              autoFocus
            />
          </label>
          <div>
            <DropDownSelector
              variant="material"
              label={t('add_dialog.project_type_label')}
              value={addType}
              options={projectTypeOptions}
              isMandatory
              disabled={adding}
              onValueUpdated={(v: string) => setAddType(v)}
              identifierVariables={{}}
              refetchQueries={[]}
            />
          </div>
          <div>
            <span className="block text-sm font-medium mb-1">
              {t('add_dialog.pdf_label')} *
            </span>
            <p className="text-xs text-label-secondary mb-2">{t('add_dialog.pdf_required')}</p>
            <input
              ref={addPdfInputRef}
              id={addPdfInputId}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={adding || pdfEncoding}
              onChange={handleAddPdfChange}
            />
            <label
              htmlFor={addPdfInputId}
              className={`inline-block cursor-pointer rounded border border-border-primary px-3 py-2 text-sm ${
                adding || pdfEncoding ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'
              }`}
            >
              {t('add_dialog.pdf_choose')}
            </label>
            {addPdfFile ? (
              <p className="mt-2 text-sm text-label-primary">
                {t('add_dialog.pdf_selected', { fileName: addPdfFile.name })}
              </p>
            ) : null}
          </div>
        </div>
      </DialogShell>

      <QuestionConfirmationDialog
        open={Boolean(pendingDelete)}
        title={t('delete_dialog.title')}
        question={
          pendingDelete
            ? t('delete_dialog.question', { title: pendingDelete.title })
            : ''
        }
        confirmationText={t('delete_dialog.confirm')}
        confirmDisabled={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={performDelete}
      />

      <ErrorMessageDialog
        errorMessage={errorMessage ?? ''}
        open={Boolean(errorMessage)}
        onClose={() => setErrorMessage(null)}
      />
    </div>
  );
};

export default ProjectDocumentationInstructionsSection;
