import { FC, useCallback, useMemo, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { useTranslations, useLocale } from 'next-intl';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import InputField from '../../../inputs/InputField';
import DropDownSelector from '../../../inputs/DropDownSelector';
import CheckboxSelector from '../../../inputs/CheckboxSelector';
import { Button } from '../../../common/Button';
import { QuestionConfirmationDialog } from '../../../common/dialogs/QuestionConfirmationDialog';
import { SAVE_PROJECT_DOCUMENTATION, SAVE_PROJECT_PRESENTATION, SAVE_PROJECT_IMAGE } from '../../../../queries/actions';
import {
  MARK_PROJECT_REVIEW_REQUESTED,
  UPDATE_PROJECT_TITLE,
  UPDATE_PROJECT_TAGLINE,
  UPDATE_PROJECT_DESCRIPTION,
  UPDATE_PROJECT_DOCUMENTATION_URL,
  UPDATE_PROJECT_PRESENTATION_URL,
  UPDATE_PROJECT_EXTERNAL_URL,
  UPDATE_PROJECT_COVER_IMAGE_URL,
  UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION,
  UPDATE_PROJECT_ACCEPTING_PARTICIPANTS,
  SUBMIT_PROJECT,
  DELETE_PROJECT_AUTHOR,
} from '../../../../queries/project';
import FileUploadField from '../../../inputs/FileUploadField';
import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../__generated__/globalTypes';
import { formattedDateWithTime, makeFullName } from '../../../../helpers/util';
import { translateErrorMessage } from '../../../../helpers/errorHandling';
import StatusChip from './StatusChip';
import ProjectNextTodos from './ProjectNextTodos';
import RequestProjectReviewDialog from './RequestProjectReviewDialog';
import SubmitConfirmationDialog from './SubmitConfirmationDialog';
import { isChecklistComplete } from './SubmissionChecklist';
import ManageRequestsDialog from './ManageRequestsDialog';
import ProjectPreviewLayout from './ProjectPreviewLayout';
import ProjectSubmissionDeadlineBelowTitle from './ProjectSubmissionDeadlineBelowTitle';
import { ProjectRow, ProjectTypeRow } from './types';
import { PROJECT_FALLBACK_TITLE } from './projectDefaults';
import { CourseProjectSubmissionDefaultSource } from './projectEffectiveSubmissionDeadline';

const PROJECT_DOCUMENTATION_ACCEPT = [
  '.pdf',
  '.doc',
  '.docx',
  '.odt',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
].join(',');
const PROJECT_PRESENTATION_ACCEPT = [
  '.pdf',
  '.ppt',
  '.pptx',
  '.odp',
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.presentation',
].join(',');

interface MyProjectPanelProps {
  project: ProjectRow;
  userId: string;
  projectTypes: ProjectTypeRow[];
  documentationInstructions: { id: number; title: string }[];
  submissionDeadline: Date | null;
  /** Course/program fallback when `project.submissionDeadline` is null (for deadline display under title). */
  courseDefaultSubmissionDeadline: string | null | undefined;
  submissionDeadlineDefaultSource: CourseProjectSubmissionDefaultSource;
  refetchQueries: string[];
  onActionError: (message: string) => void;
}

const MyProjectPanel: FC<MyProjectPanelProps> = ({
  project,
  userId,
  projectTypes,
  documentationInstructions,
  submissionDeadline,
  courseDefaultSubmissionDeadline,
  submissionDeadlineDefaultSource,
  refetchQueries,
  onActionError,
}) => {
  const t = useTranslations('course');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [requestReviewDialogOpen, setRequestReviewDialogOpen] = useState(false);
  const [requestsDialogOpen, setRequestsDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const closeRequestsDialog = useCallback(() => {
    setRequestsDialogOpen(false);
  }, []);

  const handleCoverUploadError = useCallback(
    (error: string) => {
      const normalizedKey = error.toLowerCase().replaceAll('.', '_');
      const fileUploadKey = `file_upload.${normalizedKey}`;
      const direct = tCommon(fileUploadKey);
      onActionError(direct !== fileUploadKey ? direct : translateErrorMessage(error, tCommon));
    },
    [onActionError, tCommon]
  );

  const [submitProject, { loading: submitting }] = useRoleMutation(SUBMIT_PROJECT, {
    refetchQueries,
  });
  const [markProjectReviewRequested, { loading: requestingProjectReview }] = useRoleMutation(
    MARK_PROJECT_REVIEW_REQUESTED,
    {
      refetchQueries,
    }
  );
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
  const isLastAcceptedAuthor = useMemo(
    () =>
      acceptedAuthors.length === 1 && acceptedAuthors[0]?.userId === userId,
    [acceptedAuthors, userId]
  );

  const cannotLeaveWhileRequestsPending =
    isLastAcceptedAuthor && requestedCount > 0;

  const canLeaveProject = useMemo(
    () =>
      project.status !== ProjectStatus_enum.INCOMPLETE &&
      project.status !== ProjectStatus_enum.COMPLETED &&
      project.status !== ProjectStatus_enum.PUBLISHED,
    [project.status]
  );

  const leaveDialogMessageKey = useMemo(() => {
    if (isLastAcceptedAuthor) {
      if (
        project.status === ProjectStatus_enum.PROPOSED ||
        project.status === ProjectStatus_enum.ONGOING
      ) {
        return 'leave_dialog_last_deletes_project' as const;
      }
      if (project.status === ProjectStatus_enum.SUBMITTED) {
        return 'leave_dialog_last_submitted' as const;
      }
      return 'leave_dialog_fallback' as const;
    }

    switch (project.status) {
      case ProjectStatus_enum.PROPOSED:
        return 'leave_dialog_coauthors_proposed' as const;
      case ProjectStatus_enum.ONGOING:
        return 'leave_dialog_coauthors_ongoing' as const;
      case ProjectStatus_enum.SUBMITTED:
        return 'leave_dialog_coauthors_submitted' as const;
      default:
        return 'leave_dialog_fallback' as const;
    }
  }, [isLastAcceptedAuthor, project.status]);

  const handleOpenLeaveDialog = useCallback(() => {
    if (cannotLeaveWhileRequestsPending) {
      onActionError(t('projects.my_project.must_resolve_requests_before_leave_snackbar'));
      return;
    }
    setLeaveDialogOpen(true);
  }, [cannotLeaveWhileRequestsPending, onActionError, t]);

  const projectType = useMemo(
    () => projectTypes.find((pt) => pt.value === project.type) ?? null,
    [project.type, projectTypes]
  );

  const isContentEditable =
    project.status === ProjectStatus_enum.PROPOSED ||
    project.status === ProjectStatus_enum.ONGOING;

  /** Copies from a course template (Neues Projektteam bilden) keep the template title. */
  const canEditProjectTitle = project.parentProjectId == null;

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

  const projectReviewRequestedAt = project.projectReviewRequestedAt ?? null;

  const proposedPrepComplete = useMemo(() => {
    if (project.status !== ProjectStatus_enum.PROPOSED) return false;
    const descOk = Boolean(project.description?.trim());
    const titleOk =
      !canEditProjectTitle ||
      (Boolean(project.title?.trim()) && project.title.trim() !== PROJECT_FALLBACK_TITLE);
    const teamOk = !project.acceptingParticipants || requestedCount === 0;
    return descOk && titleOk && teamOk;
  }, [project, canEditProjectTitle, requestedCount]);

  const canRequestProjectReview =
    project.status === ProjectStatus_enum.PROPOSED &&
    proposedPrepComplete &&
    !projectReviewRequestedAt;

  const handleRequestProjectReviewConfirm = useCallback(async () => {
    try {
      await markProjectReviewRequested({
        variables: {
          itemId: project.id,
          requestedAt: new Date().toISOString(),
        },
      });
      setRequestReviewDialogOpen(false);
    } catch (err) {
      onActionError(err instanceof Error ? err.message : t('projects.action_failed'));
    }
  }, [markProjectReviewRequested, project.id, onActionError, t]);

  const documentationInstructionOptions = useMemo(
    () =>
      documentationInstructions.map((tpl) => ({
        value: String(tpl.id),
        label: tpl.title,
      })),
    [documentationInstructions]
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
        <h3 className="text-lg font-semibold">{t('projects.my_project.heading')}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {requestedCount > 0 ? (
            <Tooltip title={t('projects.my_project.action_tooltip_join_requests')}>
              <span className="inline-flex">
                <Button onClick={() => setRequestsDialogOpen(true)}>
                  {t('projects.my_project.requests_button', { count: requestedCount })}
                </Button>
              </span>
            </Tooltip>
          ) : null}
          {isContentEditable && project.status === ProjectStatus_enum.PROPOSED ? (
            projectReviewRequestedAt ? (
              <Tooltip title={t('projects.my_project.action_tooltip_review_done')}>
                <span className="inline-flex">
                  <Button disabled>{t('projects.my_project.project_review_button_done')}</Button>
                </span>
              </Tooltip>
            ) : !canRequestProjectReview ? (
              <Tooltip title={t('projects.my_project.proposal_action_disabled_tooltip')}>
                <span className="inline-flex">
                  <Button filled disabled={!canRequestProjectReview}>
                    {t('projects.my_project.project_review_button')}
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Tooltip title={t('projects.my_project.action_tooltip_request_review')}>
                <span className="inline-flex">
                  <Button filled onClick={() => setRequestReviewDialogOpen(true)}>
                    {t('projects.my_project.project_review_button')}
                  </Button>
                </span>
              </Tooltip>
            )
          ) : null}
          {isContentEditable && project.status === ProjectStatus_enum.ONGOING ? (
            !canSubmit && !submitting ? (
              <Tooltip title={t('projects.my_project.submit_disabled_tooltip')}>
                <span className="inline-flex">
                  <Button filled onClick={() => setSubmitDialogOpen(true)} disabled>
                    {t('projects.my_project.submit_button')}
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Tooltip title={t('projects.my_project.action_tooltip_submit')}>
                <span className="inline-flex">
                  <Button filled onClick={() => setSubmitDialogOpen(true)} disabled={!canSubmit || submitting}>
                    {t('projects.my_project.submit_button')}
                  </Button>
                </span>
              </Tooltip>
            )
          ) : null}
        </div>
      </div>

          {isContentEditable ? (
            <div className="rounded-lg border border-border-primary p-4 bg-bg-secondary/20 space-y-2">
              <Tooltip title={t('projects.my_project.field_tooltip_next_todos_section')}>
                <div className="w-fit cursor-help border-b border-dotted border-label-secondary/35">
                  <h4 className="text-sm font-semibold text-label-primary">
                    {t('projects.my_project.next_todos_heading')}
                  </h4>
                </div>
              </Tooltip>
          <ProjectNextTodos
            project={project}
            projectType={projectType}
            canEditProjectTitle={canEditProjectTitle}
            requestedJoinCount={requestedCount}
          />
          {project.status === ProjectStatus_enum.PROPOSED && projectReviewRequestedAt ? (
            <p className="text-xs text-label-secondary pt-1">
              {t('projects.my_project.project_review_banner', {
                date: formattedDateWithTime(new Date(projectReviewRequestedAt), locale),
              })}
            </p>
          ) : null}
        </div>
      ) : null}

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

      <div className="space-y-3 min-w-0">
        <ProjectSubmissionDeadlineBelowTitle
          mode="readonly"
          project={project}
          courseDefaultSubmissionDeadline={courseDefaultSubmissionDeadline}
          defaultDeadlineSource={submissionDeadlineDefaultSource}
        />
        <div className="rounded-lg border border-border-primary p-4 bg-bg-secondary/30">
          <ProjectPreviewLayout
            project={project}
            showResourceLinks={Boolean(
              project.documentationUrl?.trim() ||
                project.presentationUrl?.trim() ||
                project.externalUrl?.trim()
            )}
            titleRow={
            isContentEditable ? (
              <div className="flex flex-wrap items-start gap-2 mb-1 w-full">
                <div className="min-w-0 flex-1">
                  {canEditProjectTitle ? (
                    <InputField
                      variant="material"
                      type="input"
                      label={t('projects.my_project.title_label')}
                      placeholder={t('projects.my_project.title_label')}
                      itemId={project.id}
                      value={project.title}
                      updateValueMutation={UPDATE_PROJECT_TITLE}
                      refetchQueries={refetchQueries}
                      helpText={t('projects.my_project.field_tooltip_title')}
                      className="[&>div]:!mt-0 [&>div]:!mb-2"
                    />
                  ) : (
                    <div className="space-y-1">
                      <h4 className="text-xl font-semibold text-label-primary min-w-0 break-words">
                        {project.title}
                      </h4>
                      <p className="text-xs text-label-secondary">
                        {t('projects.my_project.title_locked_hint')}
                      </p>
                    </div>
                  )}
                </div>
                <StatusChip status={project.status} />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="text-xl font-semibold text-label-primary min-w-0 break-words">{project.title}</h4>
                <StatusChip status={project.status} />
              </div>
            )
          }
          coverSlot={
            isContentEditable ? (
              <FileUploadField
                variant="material"
                mutationPreset="role"
                infoTooltip={t('projects.my_project.field_tooltip_cover_image')}
                currentFileUrl={project.coverImageUrl}
                uploadMutation={SAVE_PROJECT_IMAGE}
                updateMutation={UPDATE_PROJECT_COVER_IMAGE_URL}
                identifierVariables={{ itemId: project.id }}
                uploadIdentifierVariables={{ projectId: project.id }}
                updateFieldName="text"
                acceptedFileTypes="image/*"
                maxFileSize={5 * 1024 * 1024}
                imageWidth={160}
                imageHeight={96}
                showFileName
                refetchQueries={refetchQueries}
                uploadText={t('projects.my_project.cover_image_upload_text')}
                altText={t('projects.my_project.cover_image_alt')}
                onUploadError={handleCoverUploadError}
              />
            ) : undefined
          }
          taglineSlot={
            isContentEditable ? (
              <div className="mt-3 rounded border border-border-primary p-3 min-h-[3.5rem] text-sm bg-bg-secondary/50">
                <InputField
                  variant="eduhub"
                  type="input"
                  placeholder={t('projects.my_project.tagline_label')}
                  itemId={project.id}
                  value={project.tagline ?? ''}
                  updateValueMutation={UPDATE_PROJECT_TAGLINE}
                  refetchQueries={refetchQueries}
                  helpText={t('projects.my_project.field_tooltip_tagline')}
                  maxLength={400}
                  showCharacterCount={false}
                  className="!mb-2 border-transparent bg-transparent"
                />
              </div>
            ) : undefined
          }
          descriptionSlot={
            isContentEditable ? (
              <div className="rounded border border-border-primary p-3 flex-1 min-h-[10rem] text-sm bg-bg-secondary/50">
                <InputField
                  variant="eduhub"
                  type="textarea"
                  placeholder={t('projects.my_project.description_label')}
                  itemId={project.id}
                  value={project.description ?? ''}
                  updateValueMutation={UPDATE_PROJECT_DESCRIPTION}
                  refetchQueries={refetchQueries}
                  helpText={t('projects.my_project.field_tooltip_description')}
                  maxLength={8000}
                  showCharacterCount={false}
                  className="!mb-2 min-h-[9rem] border-transparent bg-transparent"
                />
              </div>
            ) : undefined
          }
        />
        </div>
      </div>

      {isContentEditable ? (
        <div className="space-y-3 pt-2 border-t border-border-primary">
          {project.status === ProjectStatus_enum.ONGOING ? (
            <>
              <FileUploadField
                variant="material"
                mutationPreset="role"
                density="compact"
                infoTooltip={t('projects.my_project.documentation_upload_tooltip')}
                currentFileUrl={project.documentationUrl}
                uploadMutation={SAVE_PROJECT_DOCUMENTATION}
                updateMutation={UPDATE_PROJECT_DOCUMENTATION_URL}
                identifierVariables={{ itemId: project.id }}
                uploadIdentifierVariables={{ projectId: project.id }}
                updateFieldName="text"
                acceptedFileTypes={PROJECT_DOCUMENTATION_ACCEPT}
                maxFileSize={25 * 1024 * 1024}
                imageWidth={52}
                imageHeight={52}
                showFileName
                refetchQueries={refetchQueries}
                uploadText={t('projects.my_project.documentation_upload_prompt')}
                altText={t('projects.my_project.documentation_upload_alt')}
                onUploadError={handleCoverUploadError}
              />
              <FileUploadField
                variant="material"
                mutationPreset="role"
                density="compact"
                infoTooltip={t('projects.my_project.presentation_upload_tooltip')}
                currentFileUrl={project.presentationUrl}
                uploadMutation={SAVE_PROJECT_PRESENTATION}
                updateMutation={UPDATE_PROJECT_PRESENTATION_URL}
                identifierVariables={{ itemId: project.id }}
                uploadIdentifierVariables={{ projectId: project.id }}
                updateFieldName="text"
                acceptedFileTypes={PROJECT_PRESENTATION_ACCEPT}
                maxFileSize={25 * 1024 * 1024}
                imageWidth={52}
                imageHeight={52}
                showFileName
                refetchQueries={refetchQueries}
                uploadText={t('projects.my_project.presentation_upload_prompt')}
                altText={t('projects.my_project.presentation_upload_alt')}
                onUploadError={handleCoverUploadError}
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
                helpText={t('projects.my_project.field_tooltip_external_url')}
              />
            </>
          ) : null}
          {documentationInstructionOptions.length > 0 ? (
            <DropDownSelector
              variant="material"
              label={t('projects.my_project.documentation_instruction_label')}
              value={project.documentationInstructionId ? String(project.documentationInstructionId) : ''}
              options={documentationInstructionOptions}
              nullable
              nullableLabel={t('projects.my_project.documentation_instruction_none')}
              updateValueMutation={UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION}
              identifierVariables={{ itemId: project.id }}
              refetchQueries={refetchQueries}
              helpText={t('projects.my_project.field_tooltip_documentation_instruction')}
            />
          ) : null}
          <CheckboxSelector
            variant="material"
            label={t('projects.my_project.accepting_participants_label')}
            checked={Boolean(project.acceptingParticipants)}
            updateValueMutation={UPDATE_PROJECT_ACCEPTING_PARTICIPANTS}
            identifierVariables={{ itemId: project.id }}
            refetchQueries={refetchQueries}
            helpText={t('projects.my_project.field_tooltip_accepting_participants')}
          />
        </div>
      ) : null}

      <div className="border-t border-border-primary pt-4">
        <div className="flex flex-wrap gap-2">
          {canLeaveProject ? (
            <Tooltip title={t('projects.my_project.action_tooltip_leave')}>
              <span className="inline-flex">
                <Button onClick={handleOpenLeaveDialog} disabled={leaving}>
                  {t('projects.my_project.leave_button')}
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title={t('projects.my_project.leave_disabled_tooltip')}>
              <span className="inline-flex">
                <Button disabled>{t('projects.my_project.leave_button')}</Button>
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      <SubmitConfirmationDialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        onConfirm={handleSubmitConfirm}
        loading={submitting}
      />

      <RequestProjectReviewDialog
        open={requestReviewDialogOpen}
        onClose={() => setRequestReviewDialogOpen(false)}
        onConfirm={handleRequestProjectReviewConfirm}
        loading={requestingProjectReview}
      />

      <ManageRequestsDialog
        open={requestsDialogOpen}
        onClose={closeRequestsDialog}
        project={project}
        refetchQueries={refetchQueries}
        onActionError={onActionError}
      />

      <QuestionConfirmationDialog
        open={leaveDialogOpen}
        title={t('projects.my_project.leave_dialog_title')}
        question={t(`projects.my_project.${leaveDialogMessageKey}`)}
        confirmationText={t('projects.my_project.leave_dialog_confirm')}
        confirmDisabled={leaving}
        onClose={() => setLeaveDialogOpen(false)}
        onConfirm={handleLeaveConfirm}
      />
    </div>
  );
};

export default MyProjectPanel;
