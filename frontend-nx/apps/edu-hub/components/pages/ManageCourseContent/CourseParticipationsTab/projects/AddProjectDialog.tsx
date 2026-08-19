import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MdAddCircle, MdClose } from 'react-icons/md';
import { useRoleMutation } from '../../../../../hooks/authedMutation';
import { useRoleQuery } from '../../../../../hooks/authedQuery';
import { DialogShell } from '../../../../common/dialogs/DialogShell';
import { SelectUserDialog } from '../../../../common/dialogs/SelectUserDialog';
import { Button } from '../../../../common/Button';
import DropDownSelector from '../../../../inputs/DropDownSelector';
import ProjectFormatSelector from '../../../CourseContent/Projects/ProjectFormatSelector';
import InstructionDownloadButton from '../../../CourseContent/Projects/InstructionDownloadButton';
import { resolveInitialProjectType } from '../../../CourseContent/Projects/projectTypeRequirements';
import { filterProjectDocumentationInstructionsWithPdf } from '../../../CourseContent/Projects/projectDocumentationInstruction';
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
  /** Pre-selects the documentation instruction (carried over from the course's last project). */
  defaultDocumentationInstructionId: number | null;
  blockedAuthorIds: Set<string>;
  refetchQueries: string[];
  onError: (msg: string) => void;
}

const isAuthorConflictError = (message: string): boolean =>
  message.includes('user_already_has_active_accepted_project_in_course') ||
  message.includes('postgres tx error');

const AddProjectDialog: FC<AddProjectDialogProps> = ({
  open,
  onClose,
  courseId,
  instructorUserId,
  defaultProjectType,
  defaultDocumentationInstructionId,
  blockedAuthorIds,
  refetchQueries,
  onError,
}) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');
  const tCourse = useTranslations('course');

  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>(defaultProjectType ?? '');
  const [instructionId, setInstructionId] = useState<string>(
    defaultDocumentationInstructionId != null
      ? String(defaultDocumentationInstructionId)
      : ''
  );
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

  // Only instructions with a stored PDF are selectable: a new project is created
  // outside PROPOSED, where Project_ongoing_requires_type_and_instruction_check
  // demands an instruction the team can actually download.
  const documentationInstructions = useMemo(
    () =>
      filterProjectDocumentationInstructionsWithPdf(
        documentationInstructionsQuery.data?.ProjectDocumentationInstruction ?? []
      ),
    [documentationInstructionsQuery.data?.ProjectDocumentationInstruction]
  );

  // A carried-over or pre-seeded instruction id is only usable when it is still
  // among the downloadable instructions of the selected type: the DB enforces the
  // type/instruction match, and a row without a PDF cannot be downloaded.
  const isUsableInstructionId = useCallback(
    (id: number | string | null, forType: string) =>
      id != null &&
      documentationInstructions.some(
        (inst) => String(inst.id) === String(id) && inst.projectTypeValue === forType
      ),
    [documentationInstructions]
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

  const selectedInstructionUrl = useMemo(
    () =>
      documentationInstructions.find((inst) => String(inst.id) === instructionId)
        ?.url ?? null,
    [documentationInstructions, instructionId]
  );

  // Always overwrite the instruction selection when the project type changes
  // so the dropdown filter (scoped to projectTypeValue === type) is never
  // stuck on a stale value from the previous type.
  const handleTypeChange = useCallback(
    (nextType: string | null) => {
      const resolved = nextType ?? '';
      setType(resolved);
      const nextDefault = documentationInstructions.find(
        (inst) => inst.projectTypeValue === resolved && inst.isDefault
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
    titleTrimmed.length > 0 &&
    type.length > 0 &&
    isUsableInstructionId(instructionId, type) &&
    !loading;
  const hasAuthors = authors.length > 0;

  const reset = useCallback(() => {
    setTitle('');
    // Default to a classical project unless the last created project was an
    // online course; a carried-over classical type is kept when still valid.
    const nextType = resolveInitialProjectType(defaultProjectType, projectTypes);
    setType(nextType);
    // Carry over the last project's documentation instruction only when it is
    // still a downloadable instruction of the resolved type; otherwise fall back
    // to that type's default instruction. When the instructions have not loaded
    // yet this clears the selection, and the seeding effect above fills in the
    // default as soon as they arrive.
    if (isUsableInstructionId(defaultDocumentationInstructionId, nextType)) {
      setInstructionId(String(defaultDocumentationInstructionId));
    } else {
      const nextDefault = nextType
        ? documentationInstructions.find(
            (inst) => inst.projectTypeValue === nextType && inst.isDefault
          )
        : null;
      setInstructionId(nextDefault ? String(nextDefault.id) : '');
    }
    setAuthors([]);
    setSelectAuthorOpen(false);
  }, [
    defaultProjectType,
    defaultDocumentationInstructionId,
    documentationInstructions,
    isUsableInstructionId,
    projectTypes,
  ]);

  // Re-seed from the latest defaults each time the dialog opens. The carried
  // over values come from an async query, so they may settle after mount.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      reset();
    }
    wasOpen.current = open;
  }, [open, reset]);

  // Seed the type once the project-type catalog finishes loading, in case the
  // dialog was opened before PROJECT_TYPES resolved (resolveInitialProjectType
  // needs the catalog to pick the baseline classical type). Guarded so it runs
  // at most once per open: otherwise it would re-seed (and hide the invalid
  // combination error) every time the user clears the type by selecting a
  // requirement combination that matches no catalog project type.
  const catalogSeededRef = useRef(false);
  useEffect(() => {
    if (!open) {
      catalogSeededRef.current = false;
      return;
    }
    if (catalogSeededRef.current || projectTypes.length === 0) return;
    catalogSeededRef.current = true;
    const seededType =
      type || resolveInitialProjectType(defaultProjectType, projectTypes);
    setType((current) => current || seededType);
    // Preserve the carried-over instruction (lost otherwise, since reset() ran
    // before the catalog resolved the type); fall back to the type's default.
    setInstructionId((current) => {
      if (current || !seededType) return current;
      if (isUsableInstructionId(defaultDocumentationInstructionId, seededType)) {
        return String(defaultDocumentationInstructionId);
      }
      const nextDefault = documentationInstructions.find(
        (inst) => inst.projectTypeValue === seededType && inst.isDefault
      );
      return nextDefault ? String(nextDefault.id) : '';
    });
  }, [
    open,
    projectTypes,
    type,
    defaultProjectType,
    defaultDocumentationInstructionId,
    documentationInstructions,
    isUsableInstructionId,
  ]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const reportAuthorConflict = useCallback(
    (user: Pick<UserSelectionWithFilter_User, 'firstName' | 'lastName'>) => {
      onError(
        t('projects.add_dialog.error_author_already_in_project', {
          name: makeFullName(user.firstName, user.lastName),
        })
      );
    },
    [onError, t]
  );

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
    const conflictingAuthor = authors.find((a) => blockedAuthorIds.has(a.id));
    if (conflictingAuthor) {
      reportAuthorConflict(conflictingAuthor);
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
      const message = err instanceof Error ? err.message : '';
      if (message && isAuthorConflictError(message)) {
        onError(t('projects.add_dialog.error_author_conflict_generic'));
        return;
      }
      onError(message || tCommon('error'));
    }
  }, [
    authors,
    blockedAuthorIds,
    courseId,
    insertProject,
    instructionId,
    instructorUserId,
    onClose,
    onError,
    reportAuthorConflict,
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
      if (blockedAuthorIds.has(user.id)) {
        reportAuthorConflict(user);
        return;
      }
      setAuthors((prev) =>
        prev.some((a) => a.id === user.id) ? prev : [...prev, user]
      );
    },
    [blockedAuthorIds, reportAuthorConflict]
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
        <div className="space-y-5">
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wide text-label-secondary mb-2">
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

          <div className="border-t border-border-primary pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-label-secondary">
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

          <div className="border-t border-border-primary pt-5">
            <ProjectFormatSelector
              projectTypes={projectTypes}
              value={type}
              onChange={handleTypeChange}
              disabled={loading || projectTypesQuery.loading}
            />
          </div>

          <div className="border-t border-border-primary pt-5 [&_.col-span-10]:!mt-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-label-secondary mb-2">
              {t('projects.add_dialog.instruction_label')}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <DropDownSelector
                  variant="material"
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
              </div>
              <InstructionDownloadButton
                url={selectedInstructionUrl}
                disabled={loading}
              />
            </div>
            <p className="mt-2 text-xs text-label-secondary whitespace-pre-line">
              {instructionHelpText}
            </p>
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
