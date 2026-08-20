import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRoleMutation } from '../../../../../hooks/authedMutation';
import { DialogShell } from '../../../../common/dialogs/DialogShell';
import { Button } from '../../../../common/Button';
import DropDownSelector from '../../../../inputs/DropDownSelector';
import ProjectFormatSelector from '../../../CourseContent/Projects/ProjectFormatSelector';
import InstructionDownloadButton from '../../../CourseContent/Projects/InstructionDownloadButton';
import InstructionUploadButton from '../../../CourseContent/Projects/InstructionUploadButton';
import DocumentationInstructionUploadDialog from './DocumentationInstructionUploadDialog';
import {
  DEFAULT_CLASSIC_REQUIREMENT_FLAGS,
  isClassicCatalogType,
  resolveClassicProjectType,
} from '../../../CourseContent/Projects/projectTypeRequirements';
import { filterProjectDocumentationInstructionsWithPdf } from '../../../CourseContent/Projects/projectDocumentationInstruction';
import { UPDATE_PROJECT_CONFIRM_TEAM } from '../../../../../queries/projectInstructor';
import { ProjectRow, ProjectTypeRow } from '../../../CourseContent/Projects/types';

interface ConfirmProjectDocumentationInstruction {
  id: number;
  title: string;
  url: string | null;
  projectTypeValue: string;
  isDefault: boolean;
}

interface ConfirmProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project: ProjectRow | null;
  projectTypes: ProjectTypeRow[];
  documentationInstructions: ConfirmProjectDocumentationInstruction[];
  programDefaultProjectType: string | null;
  refetchQueries: string[];
  onError: (msg: string) => void;
}

const ConfirmProjectDialog: FC<ConfirmProjectDialogProps> = ({
  open,
  onClose,
  project,
  projectTypes,
  documentationInstructions,
  programDefaultProjectType,
  refetchQueries,
  onError,
}) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');
  const tCourse = useTranslations('course');

  const [type, setType] = useState<string>('');
  const [instructionId, setInstructionId] = useState<string>('');
  const [instructionDialogOpen, setInstructionDialogOpen] = useState(false);
  const [submitProject, { loading }] = useRoleMutation(UPDATE_PROJECT_CONFIRM_TEAM, {
    refetchQueries,
  });

  // Confirming the team moves the project out of PROPOSED, where
  // Project_ongoing_requires_type_and_instruction_check demands an instruction the
  // team can actually download. Instructions without a stored PDF are therefore
  // neither preselected nor offered, which keeps Confirm disabled instead of
  // persisting an unusable instruction id.
  const selectableInstructions = useMemo(
    () => filterProjectDocumentationInstructionsWithPdf(documentationInstructions),
    [documentationInstructions]
  );

  const findDefaultInstructionIdForType = useCallback(
    (forType: string): number | null => {
      if (!forType) return null;
      return (
        selectableInstructions.find(
          (inst) => inst.projectTypeValue === forType && inst.isDefault
        )?.id ?? null
      );
    },
    [selectableInstructions]
  );

  // Students cannot propose online courses, so the confirm dialog is classical
  // only. Fall back to the baseline classical type whenever the carried-over
  // type is missing, the online course, or a legacy (non-cover) classical type.
  const classicBaselineType = useMemo(
    () =>
      resolveClassicProjectType(projectTypes, DEFAULT_CLASSIC_REQUIREMENT_FLAGS)
        ?.value ?? '',
    [projectTypes]
  );

  // Seeding must run once per opened project. Its dependencies include
  // selectableInstructions / findDefaultInstructionIdForType, whose identity changes
  // whenever the ProjectDocumentationInstructions query refetches - and creating an
  // instruction from this dialog does exactly that. Without this guard the effect
  // re-runs and overwrites the instruction the instructor just created with the
  // type's default.
  const seededForProjectRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      seededForProjectRef.current = null;
      return;
    }
    if (!project) return;
    if (seededForProjectRef.current === project.id) return;
    seededForProjectRef.current = project.id;
    const carried = projectTypes.find(
      (pt) => pt.value === (project.type ?? programDefaultProjectType)
    );
    const initialType =
      carried && isClassicCatalogType(carried) ? carried.value : classicBaselineType;
    setType(initialType);
    const carriedInstructionIsSelectable =
      project.documentationInstructionId != null &&
      selectableInstructions.some(
        (inst) => inst.id === project.documentationInstructionId
      );
    if (carriedInstructionIsSelectable && initialType === project.type) {
      setInstructionId(String(project.documentationInstructionId));
    } else {
      const defaultId = findDefaultInstructionIdForType(initialType);
      setInstructionId(defaultId == null ? '' : String(defaultId));
    }
  }, [
    open,
    project,
    programDefaultProjectType,
    projectTypes,
    classicBaselineType,
    findDefaultInstructionIdForType,
    selectableInstructions,
  ]);

  // Always overwrite the instruction on type change so the filtered dropdown
  // (projectTypeValue === type) never carries a stale value from the prior
  // type. Matches AddProjectDialog behaviour. `nextType` is null when the
  // checked requirement combination matches no catalog project type.
  const handleTypeChange = useCallback(
    (nextType: string | null) => {
      const resolved = nextType ?? '';
      setType(resolved);
      const defaultId = findDefaultInstructionIdForType(resolved);
      setInstructionId(defaultId == null ? '' : String(defaultId));
    },
    [findDefaultInstructionIdForType]
  );

  const acceptedAuthorNames = useMemo(() => {
    if (!project) return [];
    return (project.ProjectAuthors ?? [])
      .filter((a) => a.participationStatus === 'ACCEPTED')
      .map((a) => `${a.User?.firstName ?? ''} ${a.User?.lastName ?? ''}`.trim());
  }, [project]);

  const hasAcceptedAuthor = acceptedAuthorNames.length > 0;

  const defaultSuffix = tCourse('projects.instruction_dropdown.default_suffix');

  const instructionDropdownOptions = useMemo(
    () =>
      selectableInstructions
        .filter((inst) => inst.projectTypeValue === type)
        .slice()
        .sort((a, b) => {
          if (a.isDefault === b.isDefault) return a.title.localeCompare(b.title);
          return a.isDefault ? -1 : 1;
        })
        .map((inst) => ({
          value: String(inst.id),
          label: inst.isDefault ? `${inst.title}${defaultSuffix}` : inst.title,
        })),
    [selectableInstructions, type, defaultSuffix]
  );

  const instructionHelpText = t('projects.add_dialog.instruction_info');

  const selectedInstructionUrl = useMemo(
    () =>
      selectableInstructions.find((inst) => String(inst.id) === instructionId)
        ?.url ?? null,
    [selectableInstructions, instructionId]
  );

  const handleConfirm = async () => {
    if (!project || !type || !instructionId || !hasAcceptedAuthor) {
      return;
    }
    try {
      await submitProject({
        variables: {
          itemId: project.id,
          type,
          documentationInstructionId: Number(instructionId),
        },
      });
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : tCommon('error'));
    }
  };

  return (
    <>
      <DialogShell
        open={open}
        onClose={onClose}
        title={t('projects.confirm_project_dialog.title')}
        ariaLabelledBy="confirm-project-dialog"
        maxWidth="md"
        actions={
          <div className="flex justify-end gap-2">
            <Button onClick={onClose} disabled={loading}>
              {tCommon('cancel')}
            </Button>
            <Button
              filled
              onClick={handleConfirm}
              disabled={loading || !type || !instructionId || !hasAcceptedAuthor}
            >
              {t('projects.confirm_project_dialog.confirm_button')}
            </Button>
          </div>
        }
      >
        {project ? (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-label-secondary mb-2">
                {t('projects.confirm_project_dialog.project_title_label')}
              </p>
              <p className="text-sm font-semibold text-label-primary break-words">
                {project.title}
              </p>
            </div>
            <div className="border-t border-border-primary pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-label-secondary mb-2">
                {t('projects.confirm_project_dialog.authors_label')}
              </p>
              {hasAcceptedAuthor ? (
                <p className="text-sm">{acceptedAuthorNames.join(', ')}</p>
              ) : (
                <p className="text-sm text-error">
                  {t('projects.confirm_project_dialog.no_authors_blocking')}
                </p>
              )}
            </div>

            <div className="border-t border-border-primary pt-5">
              <ProjectFormatSelector
                projectTypes={projectTypes}
                value={type}
                onChange={handleTypeChange}
                showFormatChoice={false}
                disabled={loading}
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
                    disabled={loading}
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
                <InstructionUploadButton
                  onClick={() => setInstructionDialogOpen(true)}
                  disabled={loading || !type}
                  label={
                    type
                      ? t('projects.instruction_upload.open')
                      : t('projects.instruction_upload.disabled_no_type')
                  }
                />
              </div>
              <p className="mt-2 text-xs text-label-secondary whitespace-pre-line">
                {instructionHelpText}
              </p>
            </div>
          </div>
        ) : null}
      </DialogShell>

      {type ? (
        <DocumentationInstructionUploadDialog
          open={instructionDialogOpen}
          onClose={() => setInstructionDialogOpen(false)}
          projectTypeValue={type}
          selectedInstructionId={instructionId ? Number(instructionId) : null}
          onCreated={(newId) => setInstructionId(String(newId))}
          onSelectedDeleted={() => setInstructionId('')}
          onError={onError}
        />
      ) : null}
    </>
  );
};

export default ConfirmProjectDialog;
