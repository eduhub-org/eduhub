import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MdAddCircle, MdClose } from 'react-icons/md';
import { useRoleMutation } from '../../../../../hooks/authedMutation';
import { useRoleQuery } from '../../../../../hooks/authedQuery';
import { DialogShell } from '../../../../common/dialogs/DialogShell';
import { SelectUserDialog } from '../../../../common/dialogs/SelectUserDialog';
import { Button } from '../../../../common/Button';
import DropDownSelector from '../../../../inputs/DropDownSelector';
import { INSTRUCTOR_INSERT_PROJECT } from '../../../../../queries/projectInstructor';
import {
  PROJECT_DOCUMENTATION_INSTRUCTIONS,
  PROJECT_TYPES,
} from '../../../../../queries/project';
import { ProjectTypes } from '../../../../../queries/__generated__/ProjectTypes';
import { ProjectDocumentationInstructions } from '../../../../../queries/__generated__/ProjectDocumentationInstructions';
import { UserSelectionWithFilter_User } from '../../../../../queries/__generated__/UserSelectionWithFilter';
import { ProjectParticipationStatus_enum } from '../../../../../__generated__/globalTypes';
import { makeFullName } from '../../../../../helpers/util';

interface AddProjectDialogProps {
  open: boolean;
  onClose: () => void;
  courseId: number;
  instructorUserId: string;
  defaultProjectType: string | null;
  refetchQueries: string[];
  onError: (msg: string) => void;
}

const AddProjectDialog: FC<AddProjectDialogProps> = ({
  open,
  onClose,
  courseId,
  instructorUserId,
  defaultProjectType,
  refetchQueries,
  onError,
}) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');
  const tCourse = useTranslations('course');

  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>(defaultProjectType ?? '');
  const [instructionId, setInstructionId] = useState<string>('');
  const [authors, setAuthors] = useState<UserSelectionWithFilter_User[]>([]);
  const [selectAuthorOpen, setSelectAuthorOpen] = useState(false);

  const projectTypesQuery = useRoleQuery<ProjectTypes>(PROJECT_TYPES);
  const documentationInstructionsQuery = useRoleQuery<ProjectDocumentationInstructions>(
    PROJECT_DOCUMENTATION_INSTRUCTIONS
  );

  const projectTypes = useMemo(
    () => projectTypesQuery.data?.ProjectType ?? [],
    [projectTypesQuery.data?.ProjectType]
  );

  const documentationInstructions = useMemo(
    () =>
      documentationInstructionsQuery.data?.ProjectDocumentationInstruction ?? [],
    [documentationInstructionsQuery.data?.ProjectDocumentationInstruction]
  );

  const typeDropdownOptions = useMemo(
    () =>
      projectTypes.map((pt) => ({
        value: pt.value,
        label: tCourse(`projects.type_label.${pt.value}` as never),
      })),
    [projectTypes, tCourse]
  );

  const typeHelpText = useMemo(
    () =>
      projectTypes
        .map(
          (pt) =>
            `${tCourse(`projects.type_label.${pt.value}` as never)}\n${tCourse(`projects.type_description.${pt.value}` as never)}`
        )
        .join('\n\n'),
    [projectTypes, tCourse]
  );

  const instructionsForSelectedType = useMemo(
    () =>
      documentationInstructions.filter(
        (inst) => inst.projectTypeValue === type
      ),
    [documentationInstructions, type]
  );

  const defaultInstructionIdForType = useMemo(
    () =>
      instructionsForSelectedType.find((inst) => inst.isDefault)?.id ?? null,
    [instructionsForSelectedType]
  );

  const defaultSuffix = tCourse('projects.instruction_dropdown.default_suffix');

  const instructionDropdownOptions = useMemo(
    () =>
      [...instructionsForSelectedType]
        .sort((a, b) => {
          if (a.isDefault === b.isDefault) return a.title.localeCompare(b.title);
          return a.isDefault ? -1 : 1;
        })
        .map((inst) => ({
          value: String(inst.id),
          label: inst.isDefault ? `${inst.title}${defaultSuffix}` : inst.title,
        })),
    [instructionsForSelectedType, defaultSuffix]
  );

  const instructionHelpText = t('projects.add_dialog.instruction_info');

  // Always overwrite the instruction selection when the project type changes
  // so the dropdown filter (scoped to projectTypeValue === type) is never
  // stuck on a stale value from the previous type.
  const handleTypeChange = useCallback(
    (nextType: string) => {
      setType(nextType);
      const nextDefault = documentationInstructions.find(
        (inst) => inst.projectTypeValue === nextType && inst.isDefault
      );
      setInstructionId(nextDefault ? String(nextDefault.id) : '');
    },
    [documentationInstructions]
  );

  // First load (and subsequent reloads of the instructions list) seeds the
  // instructionId with the default for the currently selected type when none
  // has been picked yet.
  useEffect(() => {
    if (instructionId || !type) return;
    if (defaultInstructionIdForType != null) {
      setInstructionId(String(defaultInstructionIdForType));
    }
  }, [defaultInstructionIdForType, instructionId, type]);

  const [insertProject, { loading }] = useRoleMutation(INSTRUCTOR_INSERT_PROJECT, {
    refetchQueries,
  });

  const titleTrimmed = title.trim();
  const canSubmit =
    titleTrimmed.length > 0 && type.length > 0 && instructionId.length > 0 && !loading;
  const hasAuthors = authors.length > 0;

  const reset = useCallback(() => {
    setTitle('');
    const nextType = defaultProjectType ?? '';
    setType(nextType);
    const nextDefault = nextType
      ? documentationInstructions.find(
          (inst) => inst.projectTypeValue === nextType && inst.isDefault
        )
      : null;
    setInstructionId(nextDefault ? String(nextDefault.id) : '');
    setAuthors([]);
    setSelectAuthorOpen(false);
  }, [defaultProjectType, documentationInstructions]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSubmit = useCallback(async () => {
    if (!titleTrimmed) {
      onError(t('projects.add_dialog.error_title_required'));
      return;
    }
    if (!type) {
      onError(t('projects.add_dialog.error_type_required'));
      return;
    }
    if (!instructionId) {
      onError(t('projects.add_dialog.error_instruction_required'));
      return;
    }
    try {
      await insertProject({
        variables: {
          title: titleTrimmed,
          type,
          documentationInstructionId: Number(instructionId),
          proposedByUserId: instructorUserId,
          courseId,
          authors: authors.map((u) => ({
            userId: u.id,
            participationStatus: ProjectParticipationStatus_enum.ACCEPTED,
          })),
        },
      });
      reset();
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : tCommon('error'));
    }
  }, [
    authors,
    courseId,
    insertProject,
    instructionId,
    instructorUserId,
    onClose,
    onError,
    reset,
    t,
    tCommon,
    titleTrimmed,
    type,
  ]);

  const handleAuthorSelected = useCallback(
    (confirmed: boolean, user: UserSelectionWithFilter_User | null) => {
      setSelectAuthorOpen(false);
      if (!confirmed || !user) return;
      setAuthors((prev) =>
        prev.some((a) => a.id === user.id) ? prev : [...prev, user]
      );
    },
    []
  );

  const handleRemoveAuthor = useCallback((userId: unknown) => {
    setAuthors((prev) => prev.filter((a) => a.id !== userId));
  }, []);

  return (
    <>
      <DialogShell
        open={open}
        onClose={handleClose}
        title={t('projects.add_dialog.title')}
        ariaLabelledBy="add-project-dialog"
        maxWidth="md"
        actions={
          <div className="flex justify-end gap-2">
            <Button onClick={handleClose} disabled={loading}>
              {tCommon('cancel')}
            </Button>
            <Button filled onClick={handleSubmit} disabled={!canSubmit}>
              {t('projects.add_dialog.submit_button')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium mb-1">
              {t('projects.add_dialog.title_label')}
              <span className="text-status-error ml-1">*</span>
            </span>
            <input
              type="text"
              className="w-full border border-border-primary rounded px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('projects.add_dialog.title_placeholder')}
              maxLength={200}
              disabled={loading}
              autoFocus
            />
          </label>

          <div>
            <div className="[&_.col-span-10]:!mt-0">
              <DropDownSelector
                variant="material"
                label={t('projects.add_dialog.type_label')}
                placeholder={t('projects.add_dialog.type_placeholder')}
                value={type}
                options={typeDropdownOptions}
                helpText={typeHelpText}
                isMandatory
                disabled={loading || projectTypesQuery.loading}
                onValueUpdated={handleTypeChange}
                identifierVariables={{}}
                refetchQueries={[]}
              />
            </div>
            {projectTypes.length > 0 ? (
              <div className="mt-2">
                <p className="text-xs font-medium text-label-primary">
                  {t('projects.add_dialog.type_descriptions_heading')}
                </p>
                <ul className="mt-1 ml-4 space-y-1 text-xs text-label-secondary">
                  {projectTypes.map((pt) => (
                    <li key={pt.value}>
                      <span className="font-medium text-label-primary">
                        {tCourse(`projects.type_label.${pt.value}` as never)}:
                      </span>{' '}
                      {tCourse(`projects.type_description.${pt.value}` as never)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="[&_.col-span-10]:!mt-0">
            <DropDownSelector
              variant="material"
              label={t('projects.add_dialog.instruction_label')}
              placeholder={t('projects.add_dialog.instruction_placeholder')}
              value={instructionId}
              options={instructionDropdownOptions}
              isMandatory
              disabled={loading || documentationInstructionsQuery.loading}
              onValueUpdated={(v: string) => {
                setInstructionId(v);
              }}
              identifierVariables={{}}
              refetchQueries={[]}
            />
            <p className="mt-2 text-xs text-label-secondary whitespace-pre-line">
              {instructionHelpText}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {t('projects.add_dialog.authors_label')}
              </span>
              <Button onClick={() => setSelectAuthorOpen(true)} disabled={loading}>
                <MdAddCircle className="inline align-text-bottom" />{' '}
                {t('projects.add_dialog.add_author')}
              </Button>
            </div>
            {hasAuthors ? (
              <ul className="space-y-1">
                {authors.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between text-sm border border-border-primary rounded px-3 py-1"
                  >
                    <span>{makeFullName(a.firstName, a.lastName)}</span>
                    <button
                      type="button"
                      aria-label={t('projects.add_dialog.remove_author_aria')}
                      onClick={() => handleRemoveAuthor(a.id)}
                      className="p-1 rounded hover:bg-gray-200"
                      disabled={loading}
                    >
                      <MdClose />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-label-secondary">
                {t('projects.add_dialog.no_authors_added')}
              </p>
            )}
          </div>

          <div className="rounded border border-border-primary bg-bg-secondary p-3 space-y-2 text-sm text-label-secondary">
            <p>{t('projects.add_dialog.template_notice')}</p>
            <p>{t('projects.add_dialog.extra_fields_notice')}</p>
          </div>
        </div>
      </DialogShell>

      <SelectUserDialog
        open={selectAuthorOpen}
        title={t('projects.select_author_title')}
        onClose={handleAuthorSelected}
      />
    </>
  );
};

export default AddProjectDialog;
