import { FC, useCallback, useMemo, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { useTranslations, useLocale } from 'next-intl';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import InputField from '../../../inputs/InputField';
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
  UPDATE_PROJECT_ACCEPTING_PARTICIPANTS,
  UPDATE_PROJECT_AUTHOR_PARTICIPATION_STATUS,
  SUBMIT_PROJECT,
  DELETE_PROJECT_AUTHOR,
  INSERT_PROJECT_CONSENT_EVENT,
} from '../../../../queries/project';
import FileUploadField from '../../../inputs/FileUploadField';
import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../__generated__/globalTypes';
import { formattedDateWithTime, makeFullName } from '../../../../helpers/util';
import { PARTICIPANT_PROJECT_ROLE_CONTEXT } from './participantProjectRole';
import { translateErrorMessage } from '../../../../helpers/errorHandling';
import StatusChip from './StatusChip';
import {
  CourseProjectSubmissionDefaultSource,
  formatSubmissionDeadlineDate,
  getEffectiveProjectSubmissionDeadlineIso,
  isProjectSubmissionDeadlinePassed,
} from './projectEffectiveSubmissionDeadline';
import {
  isOnlineCourseProject,
  shouldShowProjectResourceDownloadLinks,
} from './projectStatusDisplay';
import ProjectNextTodos from './ProjectNextTodos';
import RequestProjectReviewDialog from './RequestProjectReviewDialog';
import SubmitConfirmationDialog, { SubmitAuthorOption } from './SubmitConfirmationDialog';
import SubmissionBlockedDialog from './SubmissionBlockedDialog';
import ProjectDeliverableReadOnlyField from './ProjectDeliverableReadOnlyField';
import {
  getProjectSubmissionBlockers,
  PROJECT_SUBMISSION_FIELD_ANCHOR_ID,
  ProjectSubmissionBlocker,
} from './SubmissionChecklist';
import {
  isProjectCoverImageIncomplete,
  isProjectDocumentationIncomplete,
  isProjectExternalUrlIncomplete,
  isProjectPresentationIncomplete,
  MANDATORY_INCOMPLETE_HIGHLIGHT_CLASS,
} from './projectMandatory';
import ManageRequestsDialog from './ManageRequestsDialog';
import PublicationConsentField from './PublicationConsentField';
import ProjectPreviewLayout from './ProjectPreviewLayout';
import ProjectReviewComment from './ProjectReviewComment';
import ProjectFormFieldSection from './ProjectFormFieldSection';
import ProjectSubmissionDeadlineBelowTitle from './ProjectSubmissionDeadlineBelowTitle';
import { ProjectRow } from './types';
import { PROJECT_FALLBACK_TITLE, PROJECT_TAGLINE_MAX_LENGTH } from './projectDefaults';
/** Extensions only — MIME variants are derived for validation; avoids raw MIME labels in the UI. */
const PROJECT_DOCUMENTATION_ACCEPT = '.pdf,.doc,.docx,.odt,.zip';
const PROJECT_PRESENTATION_ACCEPT = '.pdf,.ppt,.pptx,.odp';
const PROJECT_UPLOAD_MAX_FILE_SIZE = 23_000_000;

interface MyProjectPanelProps {
  project: ProjectRow;
  userId: string;
  /** The viewer was EXCLUDED from this project's final submission (read-only view). */
  isExcludedAuthor?: boolean;
  /** Course/program fallback when `project.submissionDeadline` is null. */
  courseDefaultSubmissionDeadline: string | null | undefined;
  submissionDeadlineDefaultSource: CourseProjectSubmissionDefaultSource;
  refetchQueries: string[];
  onActionError: (message: string) => void;
}

const MyProjectPanel: FC<MyProjectPanelProps> = ({
  project,
  userId,
  isExcludedAuthor = false,
  courseDefaultSubmissionDeadline,
  submissionDeadlineDefaultSource,
  refetchQueries,
  onActionError,
}) => {
  const t = useTranslations('course');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submissionBlockedDialogOpen, setSubmissionBlockedDialogOpen] = useState(false);
  const [submitInProgress, setSubmitInProgress] = useState(false);
  const [requestReviewDialogOpen, setRequestReviewDialogOpen] = useState(false);
  const [requestsDialogOpen, setRequestsDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const closeRequestsDialog = useCallback(() => {
    setRequestsDialogOpen(false);
  }, []);

  const handleCoverUploadError = useCallback(
    (error: string) => {
      // FileUploadField localizes client-side validation errors before calling
      // this handler. Only server message keys still need translation here.
      if (!/^[A-Z0-9_.]+$/.test(error)) {
        onActionError(error);
        return;
      }

      const normalizedKey = error.toLowerCase().replaceAll('.', '_');
      const fileUploadKey = `file_upload.${normalizedKey}`;
      const direct = tCommon(fileUploadKey);
      onActionError(direct !== fileUploadKey ? direct : translateErrorMessage(error, tCommon));
    },
    [onActionError, tCommon]
  );

  const [submitProject, { loading: submitting }] = useRoleMutation(SUBMIT_PROJECT, {
    refetchQueries,
    context: PARTICIPANT_PROJECT_ROLE_CONTEXT,
  });
  const [insertConsentEvent, { loading: consentLoading }] = useRoleMutation(
    INSERT_PROJECT_CONSENT_EVENT,
    { refetchQueries, context: PARTICIPANT_PROJECT_ROLE_CONTEXT }
  );
  const [updateAuthorParticipationStatus] = useRoleMutation(
    UPDATE_PROJECT_AUTHOR_PARTICIPATION_STATUS,
    { context: PARTICIPANT_PROJECT_ROLE_CONTEXT }
  );
  const [markProjectReviewRequested, { loading: requestingProjectReview }] = useRoleMutation(
    MARK_PROJECT_REVIEW_REQUESTED,
    {
      refetchQueries,
      context: PARTICIPANT_PROJECT_ROLE_CONTEXT,
    }
  );
  const [deleteAuthor, { loading: leaving }] = useRoleMutation(DELETE_PROJECT_AUTHOR, {
    refetchQueries,
    context: PARTICIPANT_PROJECT_ROLE_CONTEXT,
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
  // Contributor checklist shown in the submit dialog: every confirmed author,
  // with the submitter pre-checked and locked (you cannot exclude yourself).
  const submitAuthorOptions = useMemo<SubmitAuthorOption[]>(
    () =>
      acceptedAuthors.map((a) => ({
        id: a.id,
        userId: a.userId,
        name:
          makeFullName(a.User?.firstName ?? '', a.User?.lastName ?? '') ||
          tCommon('unknown_user'),
        isSelf: a.userId === userId,
      })),
    [acceptedAuthors, userId, tCommon]
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

  // The project's own type (FK-joined, user-readable) is the source of truth for
  // its deliverable requirements. Resolving it here — instead of from the
  // instructor-only ProjectType catalog query — keeps the checklist and submit
  // button working for participants.
  const projectType = project.ProjectType ?? null;

  const isContentEditable =
    project.status === ProjectStatus_enum.PROPOSED ||
    project.status === ProjectStatus_enum.ONGOING;

  const isSubmitted = project.status === ProjectStatus_enum.SUBMITTED;
  // Publication consent only matters once a project has actually been submitted.
  const isPostSubmission =
    project.status === ProjectStatus_enum.SUBMITTED ||
    project.status === ProjectStatus_enum.COMPLETED ||
    project.status === ProjectStatus_enum.PUBLISHED;
  const effectiveSubmissionDeadlineIso = useMemo(
    () =>
      getEffectiveProjectSubmissionDeadlineIso(
        project.submissionDeadline,
        courseDefaultSubmissionDeadline
      ),
    [project.submissionDeadline, courseDefaultSubmissionDeadline]
  );

  const isDeadlinePassed = useMemo(
    () =>
      isProjectSubmissionDeadlinePassed(
        project.submissionDeadline,
        courseDefaultSubmissionDeadline
      ),
    [project.submissionDeadline, courseDefaultSubmissionDeadline]
  );

  const submissionDeadlineDisplay = useMemo(
    () => formatSubmissionDeadlineDate(effectiveSubmissionDeadlineIso, locale),
    [effectiveSubmissionDeadlineIso, locale]
  );

  /** Inputs and uploads are locked once the submission deadline has passed. */
  const canEditFields = isContentEditable && !isDeadlinePassed;

  const isOnlineCourse = isOnlineCourseProject(project);
  const consentVariant = acceptedAuthors.length > 1 ? 'team' : 'solo';

  /** Online-course projects: metadata comes from the template; only documentation etc. remain editable. */
  const canEditProjectMetadata = canEditFields && !isOnlineCourse;

  /** Copies from a course template (Neues Projektteam bilden) keep the template title. */
  const canEditProjectTitle = project.parentProjectId == null;

  const submissionBlockers = useMemo(
    () =>
      getProjectSubmissionBlockers(project, projectType, {
        isSubmissionDeadlinePassed: isDeadlinePassed,
      }),
    [project, projectType, isDeadlinePassed]
  );

  /**
   * The submit button stays clickable while blockers remain: clicking it opens a
   * dialog naming what is missing instead of leaving a dead button behind a
   * tooltip.
   */
  const handleSubmitClick = useCallback(() => {
    if (submissionBlockers.length > 0) {
      setSubmissionBlockedDialogOpen(true);
      return;
    }
    setSubmitDialogOpen(true);
  }, [submissionBlockers]);

  /** Close the blocker dialog, then scroll the offending field into view. */
  const handleGoToBlockedField = useCallback((blocker: ProjectSubmissionBlocker) => {
    const anchorId = PROJECT_SUBMISSION_FIELD_ANCHOR_ID[blocker];
    setSubmissionBlockedDialogOpen(false);
    if (!anchorId) return;
    // Deferred so the dialog has closed before we scroll underneath it.
    window.setTimeout(() => {
      const section = document.getElementById(anchorId);
      if (!section) return;
      section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      section
        .querySelector<HTMLElement>('input, textarea, button, [contenteditable="true"]')
        ?.focus({ preventScroll: true });
    }, 150);
  }, []);

  // sentBackAt is stamped by set_project_submitted_metadata on SUBMITTED ->
  // ONGOING and cleared on resubmission. submittedAt cannot serve here: the
  // same trigger nulls it on the way out of SUBMITTED, so the old
  // `status === ONGOING && submittedAt` test could never be true.
  const wasSentBack =
    project.status === ProjectStatus_enum.ONGOING && Boolean(project.sentBackAt);

  const handleSubmitConfirm = useCallback(
    async (excludedAuthorIds: number[], consentGranted: boolean) => {
      setSubmitInProgress(true);
      // Track which co-authors we actually moved to EXCLUDED so we can roll
      // them back if the submission itself fails (these mutations are not in one tx).
      const applied: number[] = [];
      let submitted = false;
      try {
        // Mark unchecked co-authors EXCLUDED first (while still an ACCEPTED
        // author of an ONGOING project, which the Hasura permission requires),
        // then transition the project to SUBMITTED.
        for (const authorId of excludedAuthorIds) {
          await updateAuthorParticipationStatus({
            variables: {
              id: authorId,
              value: ProjectParticipationStatus_enum.EXCLUDED,
            },
          });
          applied.push(authorId);
        }
        await submitProject({
          variables: { itemId: project.id },
        });
        submitted = true;
        if (consentGranted) {
          // Consent insertion is best-effort: a failure here must NOT roll back
          // the exclusions — the project is already SUBMITTED at this point.
          try {
            await insertConsentEvent({
              variables: {
                projectId: project.id,
                eventType: 'granted',
                termsVersion: 'v1',
              },
            });
          } catch (err) {
            onActionError(err instanceof Error ? err.message : t('projects.action_failed'));
          }
        }
        setSubmitDialogOpen(false);
      } catch (err) {
        if (!submitted) {
          // Restore co-authors only when the submission itself never went through.
          await Promise.all(
            applied.map((authorId) =>
              updateAuthorParticipationStatus({
                variables: {
                  id: authorId,
                  value: ProjectParticipationStatus_enum.ACCEPTED,
                },
              }).catch(() => undefined)
            )
          );
        }
        onActionError(err instanceof Error ? err.message : t('projects.action_failed'));
      } finally {
        setSubmitInProgress(false);
      }
    },
    [updateAuthorParticipationStatus, submitProject, insertConsentEvent, project.id, onActionError, t]
  );

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
    const descOk = isOnlineCourse || Boolean(project.description?.trim());
    const titleOk =
      isOnlineCourse ||
      !canEditProjectTitle ||
      (Boolean(project.title?.trim()) && project.title.trim() !== PROJECT_FALLBACK_TITLE);
    const teamOk = !project.acceptingParticipants || requestedCount === 0;
    return descOk && titleOk && teamOk;
  }, [project, canEditProjectTitle, isOnlineCourse, requestedCount]);

  const canRequestProjectReview =
    project.status === ProjectStatus_enum.PROPOSED &&
    proposedPrepComplete &&
    !projectReviewRequestedAt &&
    !isDeadlinePassed;

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

  const highlightDocumentation = isProjectDocumentationIncomplete(project, projectType);
  const highlightPresentation = isProjectPresentationIncomplete(project, projectType);
  const highlightExternalUrl = isProjectExternalUrlIncomplete(project, projectType);
  const highlightCoverImage = isProjectCoverImageIncomplete(project, projectType);
  const highlightDescription =
    canEditProjectMetadata &&
    project.status === ProjectStatus_enum.PROPOSED &&
    !project.description?.trim();
  const highlightTitle =
    canEditProjectMetadata &&
    project.status === ProjectStatus_enum.PROPOSED &&
    canEditProjectTitle &&
    (!project.title?.trim() || project.title.trim() === PROJECT_FALLBACK_TITLE);

  const submittedByName = project.SubmittedByUser
    ? makeFullName(
        project.SubmittedByUser.firstName ?? '',
        project.SubmittedByUser.lastName ?? ''
      )
    : null;

  const latestConsentEvent = project.ProjectConsentEvents?.[0] ?? null;
  const publicationConsented = latestConsentEvent?.eventType === 'granted';

  const handleConsentToggle = useCallback(
    async (granted: boolean) => {
      try {
        await insertConsentEvent({
          variables: {
            projectId: project.id,
            eventType: granted ? 'granted' : 'withdrawn',
            termsVersion: 'v1',
          },
        });
      } catch (err) {
        onActionError(err instanceof Error ? err.message : t('projects.action_failed'));
      }
    },
    [insertConsentEvent, project.id, onActionError, t]
  );

  const acceptingParticipantsCheckbox =
    project.status === ProjectStatus_enum.PROPOSED ? (
      <CheckboxSelector
        variant="material"
        label={t('projects.my_project.accepting_participants_label')}
        checked={Boolean(project.acceptingParticipants)}
        updateValueMutation={UPDATE_PROJECT_ACCEPTING_PARTICIPANTS}
        identifierVariables={{ itemId: project.id }}
        refetchQueries={refetchQueries}
        helpText={t('projects.my_project.field_tooltip_accepting_participants')}
        disabled={Boolean(projectReviewRequestedAt)}
        className="w-full"
      />
    ) : null;

  // An author the submitting author dropped from the final submission gets a
  // read-only panel: the exclusion notice plus the (complete) project preview,
  // with themselves marked as excluded among the authors.
  if (isExcludedAuthor) {
    return (
      <div className="bg-fill-primary text-label-primary border border-status-confirmed rounded-lg p-6 space-y-4">
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {t('projects.my_project.excluded_banner')}
        </div>
        <ProjectReviewComment ratingComment={project.ratingComment} />
        <div className="rounded-lg border border-border-primary p-4 bg-bg-secondary/30">
          <ProjectPreviewLayout
            project={project}
            includeExcludedAuthors
            showResourceLinks={
              shouldShowProjectResourceDownloadLinks(project.status) &&
              Boolean(
                project.documentationUrl?.trim() ||
                  project.presentationUrl?.trim() ||
                  project.externalUrl?.trim()
              )
            }
            titleRow={
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="text-xl font-semibold text-label-primary min-w-0 break-words">
                  {project.title}
                </h4>
                <StatusChip
                  status={project.status}
                  rating={project.rating}
                  ratingComment={project.ratingComment}
                  suggestedForPublication={project.suggestedForPublication}
                />
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-fill-primary text-label-primary border border-status-confirmed rounded-lg p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {project.status === ProjectStatus_enum.PROPOSED ? (
            <Tooltip
              title={
                requestedCount > 0
                  ? t('projects.my_project.action_tooltip_join_requests')
                  : t('projects.my_project.action_tooltip_join_requests_none')
              }
            >
              <span className="inline-flex">
                <Button
                  onClick={() => setRequestsDialogOpen(true)}
                  disabled={requestedCount === 0}
                >
                  {requestedCount > 0
                    ? t('projects.my_project.requests_button', { count: requestedCount })
                    : t('projects.my_project.requests_button_idle')}
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
            ) : isDeadlinePassed ? (
              <Tooltip title={t('projects.my_project.project_review_disabled_deadline_tooltip')}>
                <span className="inline-flex">
                  <Button filled disabled>
                    {t('projects.my_project.project_review_button')}
                  </Button>
                </span>
              </Tooltip>
            ) : !canRequestProjectReview ? (
              <Tooltip title={t('projects.my_project.proposal_action_disabled_tooltip')}>
                <span className="inline-flex">
                  <Button filled disabled>
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
            <Tooltip
              title={
                submissionBlockers.length > 0
                  ? t('projects.my_project.submit_blocked_tooltip')
                  : t('projects.my_project.action_tooltip_submit')
              }
            >
              <span className="inline-flex">
                <Button
                  filled
                  onClick={handleSubmitClick}
                  disabled={submitting || submitInProgress}
                >
                  {t('projects.my_project.submit_button')}
                </Button>
              </span>
            </Tooltip>
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
            isSubmissionDeadlinePassed={isDeadlinePassed}
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

      {isDeadlinePassed &&
      (project.status === ProjectStatus_enum.ONGOING ||
        project.status === ProjectStatus_enum.PROPOSED) ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {t('projects.my_project.deadline_passed_banner', {
            date: submissionDeadlineDisplay ?? '',
          })}
        </div>
      ) : null}

      <ProjectReviewComment ratingComment={project.ratingComment} />

      <div className="space-y-3 min-w-0">
        {!isDeadlinePassed &&
        (project.status === ProjectStatus_enum.PROPOSED ||
          project.status === ProjectStatus_enum.ONGOING) ? (
          <ProjectSubmissionDeadlineBelowTitle
            mode="readonly"
            project={project}
            courseDefaultSubmissionDeadline={courseDefaultSubmissionDeadline}
            defaultDeadlineSource={submissionDeadlineDefaultSource}
          />
        ) : null}
        <div className="rounded-lg border border-border-primary p-4 bg-bg-secondary/30">
          <ProjectPreviewLayout
            project={project}
            includeExcludedAuthors
            showResourceLinks={
              shouldShowProjectResourceDownloadLinks(project.status) &&
              Boolean(
                project.documentationUrl?.trim() ||
                  project.presentationUrl?.trim() ||
                  project.externalUrl?.trim()
              )
            }
            titleRow={
            canEditProjectMetadata ? (
              <div className="flex flex-wrap items-start gap-2 mb-1 w-full">
                <div
                  className={`min-w-0 flex-1 ${highlightTitle ? MANDATORY_INCOMPLETE_HIGHLIGHT_CLASS : ''}`}
                >
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
                <StatusChip
                  status={project.status}
                  rating={project.rating}
                  ratingComment={project.ratingComment}
                  suggestedForPublication={project.suggestedForPublication}
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="text-xl font-semibold text-label-primary min-w-0 break-words">{project.title}</h4>
                <StatusChip
                  status={project.status}
                  rating={project.rating}
                  ratingComment={project.ratingComment}
                  suggestedForPublication={project.suggestedForPublication}
                />
              </div>
            )
          }
          coverSlot={
            canEditProjectMetadata ? (
              <ProjectFormFieldSection
                id={PROJECT_SUBMISSION_FIELD_ANCHOR_ID.coverImage}
                className={highlightCoverImage ? MANDATORY_INCOMPLETE_HIGHLIGHT_CLASS : ''}
                title={t('projects.my_project.cover_image_section_label')}
                tooltip={t('projects.my_project.field_tooltip_cover_image')}
              >
              <FileUploadField
                variant="material"
                layout="stacked"
                mutationPreset="role"
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
                refetchQueries={refetchQueries}
                uploadText={t('projects.my_project.cover_image_upload_text')}
                altText={t('projects.my_project.cover_image_alt')}
                onUploadError={handleCoverUploadError}
              />
              </ProjectFormFieldSection>
            ) : undefined
          }
          taglineSlot={
            canEditProjectMetadata ? (
              <ProjectFormFieldSection
                className="mt-3"
                title={t('projects.my_project.tagline_label')}
                tooltip={t('projects.my_project.field_tooltip_tagline')}
              >
                <div className="rounded border border-border-primary p-3 min-h-[3.5rem] text-sm bg-bg-secondary/50">
                  <InputField
                    variant="eduhub"
                    type="input"
                    placeholder={t('projects.my_project.tagline_placeholder')}
                    itemId={project.id}
                    value={project.tagline ?? ''}
                    updateValueMutation={UPDATE_PROJECT_TAGLINE}
                    refetchQueries={refetchQueries}
                    maxLength={PROJECT_TAGLINE_MAX_LENGTH}
                    showCharacterCount={false}
                    className="!mb-0 border-transparent bg-transparent [&>div]:!px-0"
                  />
                </div>
              </ProjectFormFieldSection>
            ) : undefined
          }
          descriptionSlot={
            canEditProjectMetadata ? (
              <ProjectFormFieldSection
                className={`flex flex-col flex-1 min-h-0 ${
                  highlightDescription ? MANDATORY_INCOMPLETE_HIGHLIGHT_CLASS : ''
                }`}
                title={t('projects.my_project.description_label')}
                tooltip={t('projects.my_project.field_tooltip_description')}
              >
                <div className="rounded border border-border-primary p-3 flex-1 min-h-[10rem] text-sm bg-bg-secondary/50">
                  <InputField
                    variant="eduhub"
                    type="textarea"
                    placeholder={t('projects.my_project.description_placeholder')}
                    itemId={project.id}
                    value={project.description ?? ''}
                    updateValueMutation={UPDATE_PROJECT_DESCRIPTION}
                    refetchQueries={refetchQueries}
                    maxLength={8000}
                    showCharacterCount={false}
                    className="!mb-0 min-h-[9rem] border-transparent bg-transparent [&>div]:!px-0"
                  />
                </div>
              </ProjectFormFieldSection>
            ) : undefined
          }
        />
        </div>
      </div>

      {canEditFields ? (
        <div className="space-y-3 pt-2 border-t border-border-primary">
          {project.status === ProjectStatus_enum.ONGOING ? (
            <>
              <ProjectFormFieldSection
                id={PROJECT_SUBMISSION_FIELD_ANCHOR_ID.documentation}
                className={highlightDocumentation ? MANDATORY_INCOMPLETE_HIGHLIGHT_CLASS : ''}
                title={t('projects.my_project.documentation_upload_section_label')}
                tooltip={t('projects.my_project.documentation_upload_tooltip')}
              >
              <FileUploadField
                variant="material"
                mutationPreset="role"
                density="compact"
                acceptedTypesDisplay={t('projects.my_project.documentation_accepted_types_display')}
                currentFileUrl={project.documentationUrl}
                uploadMutation={SAVE_PROJECT_DOCUMENTATION}
                updateMutation={UPDATE_PROJECT_DOCUMENTATION_URL}
                identifierVariables={{ itemId: project.id }}
                uploadIdentifierVariables={{ projectId: project.id }}
                updateFieldName="text"
                acceptedFileTypes={PROJECT_DOCUMENTATION_ACCEPT}
                maxFileSize={PROJECT_UPLOAD_MAX_FILE_SIZE}
                maxFileSizeDisplay={t('projects.my_project.upload_max_file_size')}
                imageWidth={52}
                imageHeight={52}
                showFileName
                refetchQueries={refetchQueries}
                uploadText={t('projects.my_project.documentation_upload_prompt')}
                altText={t('projects.my_project.documentation_upload_alt')}
                onUploadError={handleCoverUploadError}
              />
              </ProjectFormFieldSection>
              {!isOnlineCourse ? (
              <ProjectFormFieldSection
                id={PROJECT_SUBMISSION_FIELD_ANCHOR_ID.presentation}
                className={highlightPresentation ? MANDATORY_INCOMPLETE_HIGHLIGHT_CLASS : ''}
                title={t('projects.my_project.presentation_upload_section_label')}
                tooltip={t('projects.my_project.presentation_upload_tooltip')}
              >
              <FileUploadField
                variant="material"
                mutationPreset="role"
                density="compact"
                acceptedTypesDisplay={t('projects.my_project.presentation_accepted_types_display')}
                currentFileUrl={project.presentationUrl}
                uploadMutation={SAVE_PROJECT_PRESENTATION}
                updateMutation={UPDATE_PROJECT_PRESENTATION_URL}
                identifierVariables={{ itemId: project.id }}
                uploadIdentifierVariables={{ projectId: project.id }}
                updateFieldName="text"
                acceptedFileTypes={PROJECT_PRESENTATION_ACCEPT}
                maxFileSize={PROJECT_UPLOAD_MAX_FILE_SIZE}
                maxFileSizeDisplay={t('projects.my_project.upload_max_file_size')}
                imageWidth={52}
                imageHeight={52}
                showFileName
                refetchQueries={refetchQueries}
                uploadText={t('projects.my_project.presentation_upload_prompt')}
                altText={t('projects.my_project.presentation_upload_alt')}
                onUploadError={handleCoverUploadError}
              />
              </ProjectFormFieldSection>
              ) : null}
              {!isOnlineCourse ? (
              <ProjectFormFieldSection
                id={PROJECT_SUBMISSION_FIELD_ANCHOR_ID.externalUrl}
                className={highlightExternalUrl ? MANDATORY_INCOMPLETE_HIGHLIGHT_CLASS : ''}
                title={t('projects.my_project.external_url_label')}
                tooltip={t('projects.my_project.field_tooltip_external_url')}
              >
                <div className="rounded border border-border-primary p-3 text-sm bg-bg-secondary/50">
                  <InputField
                    variant="eduhub"
                    type="link"
                    placeholder={t('projects.my_project.external_url_placeholder')}
                    itemId={project.id}
                    value={project.externalUrl ?? ''}
                    updateValueMutation={UPDATE_PROJECT_EXTERNAL_URL}
                    refetchQueries={refetchQueries}
                    showCharacterCount={false}
                    className="!mb-0 border-transparent bg-transparent [&>div]:!px-0"
                  />
                </div>
              </ProjectFormFieldSection>
              ) : null}
            </>
          ) : null}
          {acceptingParticipantsCheckbox
            ? projectReviewRequestedAt
              ? (
                <Tooltip
                  title={t('projects.my_project.accepting_participants_disabled_review_tooltip')}
                >
                  <span className="inline-flex w-full">{acceptingParticipantsCheckbox}</span>
                </Tooltip>
              )
              : acceptingParticipantsCheckbox
            : null}
        </div>
      ) : null}

      {!canEditFields && isDeadlinePassed && project.status === ProjectStatus_enum.ONGOING ? (
        <div className="space-y-3 pt-2 border-t border-border-primary">
          <p className="text-sm text-label-secondary">
            {t('projects.my_project.deliverables_locked_notice', {
              date: submissionDeadlineDisplay ?? '',
            })}
          </p>
          {projectType?.requiresDocumentation || project.documentationUrl ? (
            <ProjectDeliverableReadOnlyField
              id={PROJECT_SUBMISSION_FIELD_ANCHOR_ID.documentation}
              title={t('projects.my_project.documentation_upload_section_label')}
              tooltip={t('projects.my_project.documentation_upload_tooltip')}
              value={project.documentationUrl}
            />
          ) : null}
          {!isOnlineCourse && (projectType?.requiresPresentation || project.presentationUrl) ? (
            <ProjectDeliverableReadOnlyField
              id={PROJECT_SUBMISSION_FIELD_ANCHOR_ID.presentation}
              title={t('projects.my_project.presentation_upload_section_label')}
              tooltip={t('projects.my_project.presentation_upload_tooltip')}
              value={project.presentationUrl}
            />
          ) : null}
          {!isOnlineCourse && (projectType?.requiresExternalUrl || project.externalUrl) ? (
            <ProjectDeliverableReadOnlyField
              id={PROJECT_SUBMISSION_FIELD_ANCHOR_ID.externalUrl}
              title={t('projects.my_project.external_url_label')}
              tooltip={t('projects.my_project.field_tooltip_external_url')}
              value={project.externalUrl}
            />
          ) : null}
        </div>
      ) : null}

      {isPostSubmission && !isOnlineCourse ? (
      <div className="border-t border-border-primary pt-4 space-y-2">
        <p className="text-sm font-semibold text-label-primary">
          {t('projects.publication_consent.heading')}
        </p>
        {latestConsentEvent ? (
          <p className="text-xs text-label-secondary">
            {publicationConsented
              ? t('projects.publication_consent.status_granted', {
                  name: makeFullName(
                    latestConsentEvent.ActorUser?.firstName ?? '',
                    latestConsentEvent.ActorUser?.lastName ?? ''
                  ) || tCommon('unknown_user'),
                  date: formattedDateWithTime(new Date(latestConsentEvent.created_at), locale),
                })
              : t('projects.publication_consent.status_withdrawn', {
                  name: makeFullName(
                    latestConsentEvent.ActorUser?.firstName ?? '',
                    latestConsentEvent.ActorUser?.lastName ?? ''
                  ) || tCommon('unknown_user'),
                  date: formattedDateWithTime(new Date(latestConsentEvent.created_at), locale),
                })}
          </p>
        ) : null}
        {myAuthorRow?.participationStatus === ProjectParticipationStatus_enum.ACCEPTED ? (
          <PublicationConsentField
            checked={publicationConsented}
            onChange={handleConsentToggle}
            variant={consentVariant}
            disabled={consentLoading}
          />
        ) : null}
      </div>
      ) : null}

      <div className="border-t border-border-primary pt-4">
        <div className="flex flex-wrap gap-2">
          {canLeaveProject ? (
            <Tooltip
              title={
                isDeadlinePassed
                  ? t('projects.my_project.leave_disabled_deadline_tooltip')
                  : t('projects.my_project.action_tooltip_leave')
              }
            >
              <span className="inline-flex">
                <Button
                  onClick={handleOpenLeaveDialog}
                  disabled={leaving || isDeadlinePassed}
                >
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

      <SubmissionBlockedDialog
        open={submissionBlockedDialogOpen}
        onClose={() => setSubmissionBlockedDialogOpen(false)}
        blockers={submissionBlockers}
        onGoToField={handleGoToBlockedField}
        submissionDeadlineDisplay={submissionDeadlineDisplay}
      />

      <SubmitConfirmationDialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        onConfirm={handleSubmitConfirm}
        loading={submitting || submitInProgress}
        authors={submitAuthorOptions}
        showPublicationConsent={!isOnlineCourse}
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
