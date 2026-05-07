import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import InputField from '../../../inputs/InputField';
import DropDownSelector from '../../../inputs/DropDownSelector';
import CheckboxSelector from '../../../inputs/CheckboxSelector';
import { Button } from '../../../common/Button';
import { QuestionConfirmationDialog } from '../../../common/dialogs/QuestionConfirmationDialog';
import {
  UPDATE_PROJECT_TITLE,
  UPDATE_PROJECT_TAGLINE,
  UPDATE_PROJECT_DESCRIPTION,
  UPDATE_PROJECT_DOCUMENTATION_URL,
  UPDATE_PROJECT_PRESENTATION_URL,
  UPDATE_PROJECT_EXTERNAL_URL,
  UPDATE_PROJECT_COVER_IMAGE_URL,
  UPDATE_PROJECT_DOCUMENTATION_TEMPLATE,
  UPDATE_PROJECT_ACCEPTING_PARTICIPANTS,
  SUBMIT_PROJECT,
  DELETE_PROJECT_AUTHOR,
} from '../../../../queries/project';
import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../__generated__/globalTypes';
import { formattedDateWithTime, makeFullName } from '../../../../helpers/util';
import StatusChip from './StatusChip';
import SubmissionChecklist, { isChecklistComplete } from './SubmissionChecklist';
import SubmitConfirmationDialog from './SubmitConfirmationDialog';
import ManageRequestsDialog from './ManageRequestsDialog';
import { ProjectRow, ProjectTypeRow } from './types';

interface MyProjectPanelProps {
  project: ProjectRow;
  userId: string;
  projectTypes: ProjectTypeRow[];
  documentationTemplates: { id: number; title: string }[];
  submissionDeadline: Date | null;
  refetchQueries: string[];
  onActionError: (message: string) => void;
}

const MyProjectPanel: FC<MyProjectPanelProps> = ({
  project,
  userId,
  projectTypes,
  documentationTemplates,
  submissionDeadline,
  refetchQueries,
  onActionError,
}) => {
  const t = useTranslations('course');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [requestsDialogOpen, setRequestsDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const [submitProject, { loading: submitting }] = useRoleMutation(SUBMIT_PROJECT, {
    refetchQueries,
  });
  const [deleteAuthor, { loading: leaving }] = useRoleMutation(DELETE_PROJECT_AUTHOR, {
    refetchQueries,
  });

  const myAuthorRow = useMemo(
    () => project.ProjectAuthors?.find((a) => a.userId === userId),
    [project.ProjectAuthors, userId]
  );
  const acceptedAuthors = useMemo(
    () =>
      (project.ProjectAuthors ?? []).filter(
        (a) => a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED
      ),
    [project.ProjectAuthors]
  );
  const requestedCount = useMemo(
    () =>
      (project.ProjectAuthors ?? []).filter(
        (a) => a.participationStatus === ProjectParticipationStatus_enum.REQUESTED
      ).length,
    [project.ProjectAuthors]
  );
  const isLastAcceptedAuthor = acceptedAuthors.length <= 1;

  const projectType = useMemo(
    () => projectTypes.find((pt) => pt.value === project.type) ?? null,
    [project.type, projectTypes]
  );

  const isContentEditable =
    project.status === ProjectStatus_enum.PROPOSED ||
    project.status === ProjectStatus_enum.ONGOING;

  const isSubmitted = project.status === ProjectStatus_enum.SUBMITTED;
  const isDeadlinePassed = useMemo(
    () => Boolean(submissionDeadline && submissionDeadline.getTime() < Date.now()),
    [submissionDeadline]
  );

  const checklistComplete = useMemo(
    () => isChecklistComplete(project, projectType),
    [project, projectType]
  );

  const canSubmit =
    project.status === ProjectStatus_enum.ONGOING &&
    checklistComplete &&
    !isDeadlinePassed;

  const wasSentBack =
    project.status === ProjectStatus_enum.ONGOING && Boolean(project.submittedAt);

  const handleSubmitConfirm = useCallback(async () => {
    try {
      await submitProject({
        variables: { itemId: project.id, submittedBy: userId },
      });
      setSubmitDialogOpen(false);
    } catch (err) {
      onActionError(err instanceof Error ? err.message : t('projects.action_failed'));
    }
  }, [submitProject, project.id, userId, onActionError, t]);

  const handleLeaveConfirm = useCallback(async () => {
    if (!myAuthorRow) {
      setLeaveDialogOpen(false);
      return;
    }
    try {
      await deleteAuthor({ variables: { id: myAuthorRow.id } });
      setLeaveDialogOpen(false);
    } catch (err) {
      onActionError(err instanceof Error ? err.message : t('projects.action_failed'));
    }
  }, [deleteAuthor, myAuthorRow, onActionError, t]);

  const documentationTemplateOptions = useMemo(
    () =>
      documentationTemplates.map((tpl) => ({
        value: String(tpl.id),
        label: tpl.title,
      })),
    [documentationTemplates]
  );

  const submittedByName = project.SubmittedByUser
    ? makeFullName(
        project.SubmittedByUser.firstName ?? '',
        project.SubmittedByUser.lastName ?? ''
      )
    : null;

  return (
    <div className="bg-fill-primary text-label-primary border border-status-confirmed rounded-lg p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{t('projects.my_project.heading')}</h3>
          <StatusChip status={project.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {requestedCount > 0 ? (
            <Button onClick={() => setRequestsDialogOpen(true)}>
              {t('projects.my_project.requests_button', { count: requestedCount })}
            </Button>
          ) : null}
          <Button onClick={() => setLeaveDialogOpen(true)} disabled={leaving}>
            {t('projects.my_project.leave_button')}
          </Button>
        </div>
      </div>

      {isSubmitted ? (
        <div className="rounded border border-purple-200 bg-purple-50 p-3 text-sm text-purple-900">
          {t('projects.my_project.submitted_banner', {
            date: project.submittedAt
              ? formattedDateWithTime(new Date(project.submittedAt), locale)
              : '',
            name: submittedByName ?? tCommon('unknown_user'),
          })}
        </div>
      ) : null}

      {wasSentBack ? (
        <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
          {t('projects.my_project.sent_back_banner')}
        </div>
      ) : null}

      {isDeadlinePassed && project.status === ProjectStatus_enum.ONGOING ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {t('projects.my_project.deadline_passed_banner', {
            date: submissionDeadline
              ? formattedDateWithTime(submissionDeadline, locale)
              : '',
          })}
        </div>
      ) : null}

      {isContentEditable ? (
        <div className="space-y-3">
          <InputField
            variant="material"
            type="input"
            label={t('projects.my_project.title_label')}
            placeholder={t('projects.my_project.title_label')}
            itemId={project.id}
            value={project.title}
            updateValueMutation={UPDATE_PROJECT_TITLE}
            refetchQueries={refetchQueries}
          />
          <InputField
            variant="material"
            type="input"
            label={t('projects.my_project.tagline_label')}
            placeholder={t('projects.my_project.tagline_label')}
            itemId={project.id}
            value={project.tagline ?? ''}
            updateValueMutation={UPDATE_PROJECT_TAGLINE}
            refetchQueries={refetchQueries}
          />
          <InputField
            variant="material"
            type="textarea"
            label={t('projects.my_project.description_label')}
            placeholder={t('projects.my_project.description_label')}
            itemId={project.id}
            value={project.description ?? ''}
            updateValueMutation={UPDATE_PROJECT_DESCRIPTION}
            refetchQueries={refetchQueries}
          />
          <InputField
            variant="material"
            type="link"
            label={t('projects.my_project.documentation_url_label')}
            placeholder={t('projects.my_project.documentation_url_placeholder')}
            itemId={project.id}
            value={project.documentationUrl ?? ''}
            updateValueMutation={UPDATE_PROJECT_DOCUMENTATION_URL}
            refetchQueries={refetchQueries}
          />
          <InputField
            variant="material"
            type="link"
            label={t('projects.my_project.presentation_url_label')}
            placeholder={t('projects.my_project.presentation_url_placeholder')}
            itemId={project.id}
            value={project.presentationUrl ?? ''}
            updateValueMutation={UPDATE_PROJECT_PRESENTATION_URL}
            refetchQueries={refetchQueries}
          />
          <InputField
            variant="material"
            type="link"
            label={t('projects.my_project.external_url_label')}
            placeholder={t('projects.my_project.external_url_placeholder')}
            itemId={project.id}
            value={project.externalUrl ?? ''}
            updateValueMutation={UPDATE_PROJECT_EXTERNAL_URL}
            refetchQueries={refetchQueries}
          />
          <InputField
            variant="material"
            type="link"
            label={t('projects.my_project.cover_image_url_label')}
            placeholder={t('projects.my_project.cover_image_url_placeholder')}
            itemId={project.id}
            value={project.coverImageUrl ?? ''}
            updateValueMutation={UPDATE_PROJECT_COVER_IMAGE_URL}
            refetchQueries={refetchQueries}
          />
          {documentationTemplateOptions.length > 0 ? (
            <DropDownSelector
              variant="material"
              label={t('projects.my_project.documentation_template_label')}
              value={project.documentationTemplateId ? String(project.documentationTemplateId) : ''}
              options={documentationTemplateOptions}
              nullable
              nullableLabel={t('projects.my_project.documentation_template_none')}
              updateValueMutation={UPDATE_PROJECT_DOCUMENTATION_TEMPLATE}
              identifierVariables={{ itemId: project.id }}
              refetchQueries={refetchQueries}
            />
          ) : null}
          <CheckboxSelector
            variant="material"
            label={t('projects.my_project.accepting_participants_label')}
            checked={Boolean(project.acceptingParticipants)}
            updateValueMutation={UPDATE_PROJECT_ACCEPTING_PARTICIPANTS}
            identifierVariables={{ itemId: project.id }}
            refetchQueries={refetchQueries}
          />
        </div>
      ) : (
        <ReadOnlyProjectDetails project={project} />
      )}

      <div className="border-t border-border-primary pt-4 space-y-2">
        <h4 className="text-sm font-medium text-label-primary">
          {t('projects.my_project.checklist_heading')}
        </h4>
        <SubmissionChecklist project={project} projectType={projectType} />
        <Button
          filled
          onClick={() => setSubmitDialogOpen(true)}
          disabled={!canSubmit || submitting}
        >
          {t('projects.my_project.submit_button')}
        </Button>
      </div>

      <SubmitConfirmationDialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        onConfirm={handleSubmitConfirm}
        loading={submitting}
      />

      <ManageRequestsDialog
        open={requestsDialogOpen}
        onClose={() => setRequestsDialogOpen(false)}
        project={project}
        refetchQueries={refetchQueries}
      />

      <QuestionConfirmationDialog
        open={leaveDialogOpen}
        question={
          isLastAcceptedAuthor
            ? t('projects.my_project.leave_dialog_last_question')
            : t('projects.my_project.leave_dialog_question')
        }
        confirmationText={t('projects.my_project.leave_dialog_confirm')}
        onClose={() => setLeaveDialogOpen(false)}
        onConfirm={handleLeaveConfirm}
      />
    </div>
  );
};

interface ReadOnlyProjectDetailsProps {
  project: ProjectRow;
}

const ReadOnlyProjectDetails: FC<ReadOnlyProjectDetailsProps> = ({ project }) => {
  const t = useTranslations('course');

  return (
    <div className="space-y-2 text-sm">
      <div>
        <span className="font-medium">{t('projects.my_project.title_label')}: </span>
        <span>{project.title}</span>
      </div>
      {project.tagline ? (
        <div>
          <span className="font-medium">{t('projects.my_project.tagline_label')}: </span>
          <span>{project.tagline}</span>
        </div>
      ) : null}
      {project.description ? (
        <p className="whitespace-pre-line">{project.description}</p>
      ) : null}
      {project.documentationUrl ? (
        <a
          href={project.documentationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-status-confirmed underline"
        >
          {t('projects.table.documentation_link')}
        </a>
      ) : null}
      {project.presentationUrl ? (
        <a
          href={project.presentationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-status-confirmed underline"
        >
          {t('projects.table.presentation_link')}
        </a>
      ) : null}
      {project.externalUrl ? (
        <a
          href={project.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-status-confirmed underline"
        >
          {t('projects.table.external_link')}
        </a>
      ) : null}
    </div>
  );
};

export default MyProjectPanel;
