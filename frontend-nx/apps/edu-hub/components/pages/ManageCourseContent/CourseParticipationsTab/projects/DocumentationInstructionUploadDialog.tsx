import { FC, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ApolloError } from '@apollo/client';
import { MdDelete } from 'react-icons/md';
import { DialogShell } from '../../../../common/dialogs/DialogShell';
import { QuestionConfirmationDialog } from '../../../../common/dialogs/QuestionConfirmationDialog';
import { Button } from '../../../../common/Button';
import InputField from '../../../../inputs/InputField';
import InstructionDownloadButton from '../../../CourseContent/Projects/InstructionDownloadButton';
import { useRoleMutation } from '../../../../../hooks/authedMutation';
import { useRoleQuery } from '../../../../../hooks/authedQuery';
import { useFileUploader } from '../../../../../hooks/fileUpload';
import { useUserId } from '../../../../../hooks/user';
import {
  DELETE_PROJECT_DOCUMENTATION_INSTRUCTION,
  DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_ACTION,
  INSERT_PROJECT_DOCUMENTATION_INSTRUCTION,
  MY_PROJECT_DOCUMENTATION_INSTRUCTIONS,
  SAVE_PROJECT_DOCUMENTATION_INSTRUCTION,
  UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION_TITLE,
  UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION_URL,
} from '../../../../../queries/projectDocumentationInstruction';
import {
  MyProjectDocumentationInstructions,
  MyProjectDocumentationInstructionsVariables,
  MyProjectDocumentationInstructions_ProjectDocumentationInstruction,
} from '../../../../../queries/__generated__/MyProjectDocumentationInstructions';

/** PDFs only: the action enforces the same via allowed-file-extensions + magic bytes. */
const INSTRUCTION_ACCEPT = 'application/pdf,.pdf';
const TITLE_MAX_LENGTH = 200;
/**
 * How many of the caller's own instructions are fetched at once. The list is meant
 * to be read as a whole, so "load more" widens this window instead of paging.
 */
const OWN_LIST_PAGE_SIZE = 25;

type OwnInstruction =
  MyProjectDocumentationInstructions_ProjectDocumentationInstruction;

interface DocumentationInstructionUploadDialogProps {
  open: boolean;
  onClose: () => void;
  /** Instructions belong to exactly one project type; never opened without one. */
  projectTypeValue: string;
  /**
   * Fires once the row exists, its PDF is stored and the shared instruction query
   * has been refetched — so the id is already among every dropdown's options.
   */
  onCreated: (instructionId: number) => void;
  /** Instruction currently selected at the call site, if any. */
  selectedInstructionId?: number | null;
  /** Fires when `selectedInstructionId` was deleted, so callers can re-select. */
  onSelectedDeleted?: () => void;
  onError: (message: string) => void;
  /** Call-site refetches to run on top of this dialog's own. */
  refetchQueries?: string[];
}

/**
 * Lets an instructor manage the documentation instructions they created for one
 * project type: upload a new PDF, rename, replace the PDF, or delete.
 *
 * Ownership is enforced server-side, not here — the Hasura insert preset stamps
 * `createdByUserId`, the update/delete permissions filter on it, and the
 * saveProjectDocumentationInstruction handler re-checks it before storing a file.
 * Platform (admin-maintained) instructions are therefore never listed or editable.
 */
const DocumentationInstructionUploadDialog: FC<
  DocumentationInstructionUploadDialogProps
> = ({
  open,
  onClose,
  projectTypeValue,
  onCreated,
  selectedInstructionId,
  onSelectedDeleted,
  onError,
  refetchQueries = [],
}) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');
  const userId = useUserId();

  const [title, setTitle] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OwnInstruction | null>(null);
  const [ownListLimit, setOwnListLimit] = useState(OWN_LIST_PAGE_SIZE);

  const pdfInputId = useId();
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  // Refetch the shared dropdown query too, otherwise a newly created instruction
  // is not yet an option at the call site when onCreated selects it.
  const refetch = useMemo(
    () => [
      'ProjectDocumentationInstructions',
      'MyProjectDocumentationInstructions',
      ...refetchQueries,
    ],
    [refetchQueries]
  );

  const ownInstructionsQuery = useRoleQuery<
    MyProjectDocumentationInstructions,
    MyProjectDocumentationInstructionsVariables
  >(MY_PROJECT_DOCUMENTATION_INSTRUCTIONS, {
    variables: {
      filter: {
        projectTypeValue: { _eq: projectTypeValue },
        createdByUserId: { _eq: userId },
      },
      // One extra row so a further page can be detected without a count query.
      limit: ownListLimit + 1,
    },
    skip: !open || !projectTypeValue || !userId,
    fetchPolicy: 'cache-and-network',
  });

  const [insertInstruction] = useRoleMutation(
    INSERT_PROJECT_DOCUMENTATION_INSTRUCTION
  );
  const [saveInstructionFile] = useRoleMutation(
    SAVE_PROJECT_DOCUMENTATION_INSTRUCTION
  );
  const [updateInstructionUrl] = useRoleMutation(
    UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION_URL
  );
  // Rollback for a half-finished create. The narrow Hasura delete permission only
  // covers own draft rows (url IS NULL), which is exactly this case.
  const [deleteDraftInstruction] = useRoleMutation(
    DELETE_PROJECT_DOCUMENTATION_INSTRUCTION
  );
  // Real deletions go through the action so referencing projects are reassigned to
  // the type default first (Project.documentationInstructionId is ON DELETE RESTRICT).
  const [deleteInstruction] = useRoleMutation(
    DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_ACTION,
    { refetchQueries: refetch }
  );
  const { getFileBase64, isLoading: pdfEncoding } = useFileUploader();

  const fetchedOwnInstructions =
    ownInstructionsQuery.data?.ProjectDocumentationInstruction ?? [];
  const hasMoreOwnInstructions = fetchedOwnInstructions.length > ownListLimit;
  const ownInstructions = hasMoreOwnInstructions
    ? fetchedOwnInstructions.slice(0, ownListLimit)
    : fetchedOwnInstructions;
  // `cache-and-network` yields an empty list on the first pass, so the empty state
  // must not be shown until the query has actually resolved once.
  const ownListLoading =
    ownInstructionsQuery.loading && ownInstructionsQuery.data === undefined;

  const resetForm = useCallback(() => {
    setTitle('');
    setPdfFile(null);
    setOwnListLimit(OWN_LIST_PAGE_SIZE);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  }, []);

  useEffect(() => {
    if (!open) resetForm();
  }, [open, resetForm]);

  const handleClose = useCallback(() => {
    // Closing mid-create would leave the user unsure whether the row was written.
    if (busy) return;
    onClose();
  }, [busy, onClose]);

  const canSubmit =
    Boolean(title.trim()) && pdfFile !== null && !busy && !pdfEncoding;

  /**
   * Stores `file` as the PDF of an existing instruction and persists the returned
   * path. Shared by the create flow and by replacing the PDF of a listed
   * instruction. Returns true on success; the caller decides how to recover.
   */
  const uploadPdfFor = useCallback(
    async (instructionId: number, file: File): Promise<boolean> => {
      const base64File = await getFileBase64(file);
      if (!base64File) {
        onError(t('projects.instruction_upload.error.pdf_upload_failed'));
        return false;
      }

      const uploadResult = await saveInstructionFile({
        variables: {
          base64File,
          fileName: file.name,
          projectDocumentationInstructionId: instructionId,
        },
      });
      const uploadPayload = uploadResult.data?.saveProjectDocumentationInstruction;
      if (!uploadPayload?.success || !uploadPayload.filePath) {
        onError(
          uploadPayload?.error ??
            t('projects.instruction_upload.error.pdf_upload_failed')
        );
        return false;
      }

      // awaitRefetchQueries matters: the call sites only accept an instruction that
      // is already among their (PDF-bearing) options, so the refetch has to land
      // before onCreated selects it.
      await updateInstructionUrl({
        variables: { itemId: instructionId, url: uploadPayload.filePath },
        refetchQueries: refetch,
        awaitRefetchQueries: true,
      });
      return true;
    },
    [getFileBase64, saveInstructionFile, updateInstructionUrl, refetch, onError, t]
  );

  const handleReplacePdf = useCallback(
    async (instructionId: number, file: File | null) => {
      if (!file) return;
      setBusy(true);
      try {
        await uploadPdfFor(instructionId, file);
      } catch (err) {
        onError(
          err instanceof Error
            ? err.message
            : t('projects.instruction_upload.error.pdf_upload_failed')
        );
      } finally {
        setBusy(false);
      }
    },
    [uploadPdfFor, onError, t]
  );

  /**
   * Three non-atomic steps: insert the row, store the PDF under a path derived
   * from its id, then persist the returned path. Every failure branch removes the
   * draft row again so a retry does not collide with its own leftovers.
   */
  const handleSubmit = useCallback(async () => {
    const titleTrimmed = title.trim();
    if (!titleTrimmed || !pdfFile) return;

    setBusy(true);
    let createdId: number | null = null;

    const rollback = async () => {
      if (createdId == null) return;
      try {
        await deleteDraftInstruction({ variables: { id: createdId } });
      } catch {
        // Best-effort: a url-less draft is hidden from every picker and the owner
        // can still delete it from the list below.
      }
    };

    try {
      const insertResult = await insertInstruction({
        variables: { title: titleTrimmed, projectTypeValue },
      });
      createdId =
        insertResult.data?.insert_ProjectDocumentationInstruction_one?.id ?? null;
      if (createdId == null) {
        onError(t('projects.instruction_upload.error.create_failed'));
        return;
      }

      const stored = await uploadPdfFor(createdId, pdfFile);
      if (!stored) {
        await rollback();
        return;
      }

      onCreated(createdId);
      resetForm();
      onClose();
    } catch (err) {
      await rollback();
      if (err instanceof ApolloError && err.message.includes('duplicate key value')) {
        onError(t('projects.instruction_upload.error.duplicate_title'));
      } else if (err instanceof ApolloError) {
        onError(err.message);
      } else {
        onError(t('projects.instruction_upload.error.pdf_upload_failed'));
      }
    } finally {
      setBusy(false);
    }
  }, [
    title,
    pdfFile,
    projectTypeValue,
    insertInstruction,
    deleteDraftInstruction,
    uploadPdfFor,
    onCreated,
    onClose,
    onError,
    resetForm,
    t,
  ]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      const result = await deleteInstruction({
        variables: { instructionId: target.id },
      });
      const payload = result.data?.deleteProjectDocumentationInstruction;
      if (!payload?.success) {
        onError(
          payload?.error ?? t('projects.instruction_upload.error.delete_failed')
        );
        return;
      }
      if (selectedInstructionId === target.id) onSelectedDeleted?.();
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : t('projects.instruction_upload.error.delete_failed')
      );
    }
  }, [
    deleteTarget,
    deleteInstruction,
    onError,
    onSelectedDeleted,
    selectedInstructionId,
    t,
  ]);

  return (
    <>
      <DialogShell
        open={open}
        onClose={handleClose}
        title={t('projects.instruction_upload.dialog_title')}
        ariaLabelledBy="documentation-instruction-upload-dialog"
        maxWidth="sm"
        actions={
          <div className="flex justify-end gap-2">
            <Button onClick={handleClose} disabled={busy}>
              {tCommon('cancel')}
            </Button>
            <Button filled onClick={handleSubmit} disabled={!canSubmit}>
              {t('projects.instruction_upload.submit')}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-label-secondary">
              {t('projects.instruction_upload.create_heading')}
            </p>
            <p className="text-xs text-label-secondary">
              {t('projects.instruction_upload.create_help')}
            </p>

            <label className="block">
              <span className="block text-sm font-medium mb-1">
                {t('projects.instruction_upload.title_label')} *
              </span>
              <input
                type="text"
                className="w-full border border-border-primary rounded px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('projects.instruction_upload.title_placeholder')}
                maxLength={TITLE_MAX_LENGTH}
                disabled={busy}
                autoFocus
              />
            </label>

            <div>
              <span className="block text-sm font-medium mb-1">
                {t('projects.instruction_upload.pdf_label')} *
              </span>
              <p className="text-xs text-label-secondary mb-2">
                {t('projects.instruction_upload.pdf_required')}
              </p>
              <input
                ref={pdfInputRef}
                id={pdfInputId}
                type="file"
                accept={INSTRUCTION_ACCEPT}
                className="sr-only"
                disabled={busy || pdfEncoding}
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              />
              <label
                htmlFor={pdfInputId}
                className={`inline-block cursor-pointer rounded border border-border-primary px-3 py-2 text-sm ${
                  busy || pdfEncoding
                    ? 'opacity-50 pointer-events-none'
                    : 'hover:bg-bg-secondary'
                }`}
              >
                {t('projects.instruction_upload.pdf_choose')}
              </label>
              {pdfFile ? (
                <p className="mt-2 text-sm text-label-primary">
                  {t('projects.instruction_upload.pdf_selected', {
                    fileName: pdfFile.name,
                  })}
                </p>
              ) : null}
            </div>
          </div>

          <div className="border-t border-border-primary pt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-label-secondary">
              {t('projects.instruction_upload.own_list_heading')}
            </p>
            <p className="text-xs text-label-secondary">
              {t('projects.instruction_upload.own_list_help')}
            </p>

            {ownListLoading ? (
              <p className="text-sm text-label-secondary">{tCommon('loading')}</p>
            ) : ownInstructions.length === 0 ? (
              <p className="text-sm text-label-secondary">
                {t('projects.instruction_upload.own_list_empty')}
              </p>
            ) : (
              <ul className="space-y-4">
                {ownInstructions.map((instruction) => (
                  <li
                    key={instruction.id}
                    className="rounded border border-border-primary p-3 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0 [&_.col-span-10]:!mt-0">
                        <InputField
                          variant="material"
                          type="input"
                          itemId={instruction.id}
                          value={instruction.title}
                          updateValueMutation={
                            UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION_TITLE
                          }
                          refetchQueries={refetch}
                          maxLength={TITLE_MAX_LENGTH}
                          className="!mb-0"
                        />
                      </div>
                      <InstructionDownloadButton url={instruction.url} />
                      <button
                        type="button"
                        aria-label={t('projects.instruction_upload.delete_tooltip')}
                        title={t('projects.instruction_upload.delete_tooltip')}
                        onClick={() => setDeleteTarget(instruction)}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded border border-border-primary text-label-secondary hover:bg-bg-secondary touch-manipulation"
                      >
                        <MdDelete />
                      </button>
                    </div>
                    {/*
                      A plain replace control rather than FileUploadField: that
                      component always renders a remove button which, without a
                      removeMutation, falls back to the update mutation and writes
                      url = NULL - hiding an instruction that projects still
                      reference. Replacing keeps the row and every project pointing
                      at it.
                    */}
                    <div className="flex items-center gap-2">
                      <input
                        id={`${pdfInputId}-replace-${instruction.id}`}
                        type="file"
                        accept={INSTRUCTION_ACCEPT}
                        className="sr-only"
                        disabled={busy || pdfEncoding}
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          e.target.value = '';
                          void handleReplacePdf(instruction.id, file);
                        }}
                      />
                      <label
                        htmlFor={`${pdfInputId}-replace-${instruction.id}`}
                        className={`inline-block cursor-pointer rounded border border-border-primary px-3 py-1.5 text-xs ${
                          busy || pdfEncoding
                            ? 'opacity-50 pointer-events-none'
                            : 'hover:bg-bg-secondary'
                        }`}
                      >
                        {t('projects.instruction_upload.replace_label')}
                      </label>
                      {instruction.url ? null : (
                        <span className="text-xs text-warning">
                          {t('projects.instruction_upload.missing_pdf')}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {hasMoreOwnInstructions ? (
              <Button
                onClick={() => setOwnListLimit((n) => n + OWN_LIST_PAGE_SIZE)}
              >
                {t('projects.instruction_upload.load_more')}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogShell>

      <QuestionConfirmationDialog
        open={Boolean(deleteTarget)}
        title={t('projects.instruction_upload.delete_dialog.title')}
        question={t('projects.instruction_upload.delete_dialog.question', {
          title: deleteTarget?.title ?? '',
        })}
        confirmationText={t('projects.instruction_upload.delete_dialog.confirm')}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default DocumentationInstructionUploadDialog;
