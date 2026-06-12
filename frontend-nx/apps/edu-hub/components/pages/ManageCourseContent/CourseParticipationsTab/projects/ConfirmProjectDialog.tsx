import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRoleMutation } from '../../../../../hooks/authedMutation';
import { DialogShell } from '../../../../common/dialogs/DialogShell';
import { Button } from '../../../../common/Button';
import DropDownSelector from '../../../../inputs/DropDownSelector';
import ProjectTypeRequirementSelector from '../../../CourseContent/Projects/ProjectTypeRequirementSelector';
import { UPDATE_PROJECT_CONFIRM_TEAM } from '../../../../../queries/projectInstructor';
import { ProjectRow, ProjectTypeRow } from '../../../CourseContent/Projects/types';

interface ConfirmProjectDocumentationInstruction {
  id: number;
  title: string;
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
  const [submitProject, { loading }] = useRoleMutation(UPDATE_PROJECT_CONFIRM_TEAM, {
    refetchQueries,
  });

  const findDefaultInstructionIdForType = useCallback(
    (forType: string): number | null => {
      if (!forType) return null;
      return (
        documentationInstructions.find(
          (inst) => inst.projectTypeValue === forType && inst.isDefault
        )?.id ?? null
      );
    },
    [documentationInstructions]
  );

  useEffect(() => {
    if (!project) return;
    const initialType =
      project.type ?? programDefaultProjectType ?? projectTypes[0]?.value ?? '';
    setType(initialType);
    if (project.documentationInstructionId) {
      setInstructionId(String(project.documentationInstructionId));
    } else {
      const defaultId = findDefaultInstructionIdForType(initialType);
      setInstructionId(defaultId == null ? '' : String(defaultId));
    }
  }, [open, project, programDefaultProjectType, projectTypes, findDefaultInstructionIdForType]);

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
      documentationInstructions
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
    [documentationInstructions, type, defaultSuffix]
  );

  const instructionHelpText = t('projects.add_dialog.instruction_info');

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
    <DialogShell
      open={open}
      onClose={onClose}
      title={t('projects.confirm_project_dialog.title')}
      ariaLabelledBy="confirm-project-dialog"
      maxWidth="sm"
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
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">
              {t('projects.confirm_project_dialog.project_title_label')}
            </p>
            <p className="text-sm font-semibold text-label-primary break-words">
              {project.title}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">
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
          <ProjectTypeRequirementSelector
            projectTypes={projectTypes}
            value={type}
            onChange={handleTypeChange}
            programDefaultType={programDefaultProjectType}
            disabled={loading}
          />

          <div className="[&_.col-span-10]:!mt-0">
            <DropDownSelector
              variant="material"
              label={t('projects.add_dialog.instruction_label')}
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
            <p className="mt-2 text-xs text-label-secondary whitespace-pre-line">
              {instructionHelpText}
            </p>
          </div>
        </div>
      ) : null}
    </DialogShell>
  );
};

export default ConfirmProjectDialog;
