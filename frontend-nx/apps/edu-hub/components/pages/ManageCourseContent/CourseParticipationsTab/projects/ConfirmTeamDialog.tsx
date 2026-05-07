import { FC, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRoleMutation } from '../../../../../hooks/authedMutation';
import { DialogShell } from '../../../../common/dialogs/DialogShell';
import { Button } from '../../../../common/Button';
import { UPDATE_PROJECT_CONFIRM_TEAM } from '../../../../../queries/projectInstructor';
import { ProjectRow, ProjectTypeRow } from '../../../CourseContent/Projects/types';

interface ConfirmTeamDialogProps {
  open: boolean;
  onClose: () => void;
  project: ProjectRow | null;
  projectTypes: ProjectTypeRow[];
  documentationTemplates: { id: number; title: string }[];
  programDefaultProjectType: string | null;
  refetchQueries: string[];
  onError: (msg: string) => void;
}

const ConfirmTeamDialog: FC<ConfirmTeamDialogProps> = ({
  open,
  onClose,
  project,
  projectTypes,
  documentationTemplates,
  programDefaultProjectType,
  refetchQueries,
  onError,
}) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');
  const tCourse = useTranslations('course');

  const [type, setType] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [submitProject, { loading }] = useRoleMutation(UPDATE_PROJECT_CONFIRM_TEAM, {
    refetchQueries,
  });

  useEffect(() => {
    if (!project) return;
    setType(project.type ?? programDefaultProjectType ?? projectTypes[0]?.value ?? '');
    setTemplateId(
      project.documentationTemplateId
        ? String(project.documentationTemplateId)
        : ''
    );
  }, [open, project, programDefaultProjectType, projectTypes]);

  const acceptedAuthorNames = useMemo(() => {
    if (!project) return [];
    return (project.ProjectAuthors ?? [])
      .filter((a) => a.participationStatus === 'ACCEPTED')
      .map((a) => `${a.User?.firstName ?? ''} ${a.User?.lastName ?? ''}`.trim());
  }, [project]);

  const hasAcceptedAuthor = acceptedAuthorNames.length > 0;

  const handleConfirm = async () => {
    if (!project || !type || !templateId || !hasAcceptedAuthor) {
      return;
    }
    try {
      await submitProject({
        variables: {
          itemId: project.id,
          type,
          documentationTemplateId: Number(templateId),
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
      title={t('projects.confirm_team_dialog.title')}
      ariaLabelledBy="confirm-team-dialog"
      maxWidth="sm"
      actions={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={loading}>
            {tCommon('cancel')}
          </Button>
          <Button
            filled
            onClick={handleConfirm}
            disabled={loading || !type || !templateId || !hasAcceptedAuthor}
          >
            {t('projects.confirm_team_dialog.confirm_button')}
          </Button>
        </div>
      }
    >
      {project ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">{t('projects.confirm_team_dialog.authors_label')}</p>
            {hasAcceptedAuthor ? (
              <p className="text-sm">{acceptedAuthorNames.join(', ')}</p>
            ) : (
              <p className="text-sm text-error">
                {t('projects.confirm_team_dialog.no_authors_blocking')}
              </p>
            )}
          </div>
          <label className="block">
            <span className="block text-sm font-medium mb-1">
              {t('projects.confirm_team_dialog.type_label')}
            </span>
            <select
              className="w-full border border-border-primary rounded px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={loading}
            >
              <option value="" disabled>
                {t('projects.confirm_team_dialog.type_placeholder')}
              </option>
              {projectTypes.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {tCourse(`projects.type_label.${pt.value}` as never)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1">
              {t('projects.confirm_team_dialog.template_label')}
            </span>
            <select
              className="w-full border border-border-primary rounded px-3 py-2"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              disabled={loading}
            >
              <option value="" disabled>
                {t('projects.confirm_team_dialog.template_placeholder')}
              </option>
              {documentationTemplates.map((tpl) => (
                <option key={tpl.id} value={String(tpl.id)}>
                  {tpl.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </DialogShell>
  );
};

export default ConfirmTeamDialog;
