import { FC, ReactElement, useCallback, useMemo } from 'react';
import { ApolloError } from '@apollo/client';
import { ColumnDef } from '@tanstack/react-table';
import Tooltip from '@mui/material/Tooltip';
import { useLocale, useTranslations } from 'next-intl';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { useIsAdmin, useIsInstructor, useIsUser } from '../../../../hooks/authentication';
import { useUserId } from '../../../../hooks/user';
import { AuthRoles } from '../../../../types/enums';
import TableGrid from '../../../common/TableGrid';
import { Button } from '../../../common/Button';
import {
  COPY_PROJECT_FROM_TEMPLATE,
  INSERT_PROJECT_AUTHOR_REQUEST,
  INSERT_PROJECT_AUTHOR_REQUEST_AS_ADMIN,
} from '../../../../queries/project';
import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../__generated__/globalTypes';
import { formatTruncatedList, makeFullName } from '../../../../helpers/util';
import StatusChip from './StatusChip';
import { getDisplayAuthors, isExcludedAuthor } from './projectAuthors';
import {
  formatSubmissionDeadlineDate,
  getEffectiveProjectSubmissionDeadlineIso,
  isProjectSubmissionDeadlinePassed,
} from './projectEffectiveSubmissionDeadline';
import {
  getProjectStatusChipKey,
  isOnlineCourseProject,
  shouldShowProjectResourceDownloadLinks,
} from './projectStatusDisplay';
import ProjectPreviewLayout from './ProjectPreviewLayout';
import ProjectSubmissionDeadlineBelowTitle from './ProjectSubmissionDeadlineBelowTitle';
import { ProjectRow } from './types';
import { CourseProjectSubmissionDefaultSource } from './projectEffectiveSubmissionDeadline';

interface ProjectsTableProps {
  projects: ProjectRow[];
  loading: boolean;
  error: any;
  courseId: number;
  userId: string | undefined;
  showProposeButton: boolean;
  hasMyProject: boolean;
  courseDefaultSubmissionDeadline: string | null | undefined;
  submissionDeadlineDefaultSource: CourseProjectSubmissionDefaultSource;
  refetchQueries: string[];
  onProposeClick: () => void;
  onActionError: (message: string) => void;
}

const computeAcceptedCount = (project: ProjectRow): number =>
  (project.ProjectAuthors ?? []).filter(
    (a) => a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED
  ).length;

const ProjectsTable: FC<ProjectsTableProps> = ({
  projects,
  loading,
  error,
  courseId,
  userId,
  showProposeButton,
  hasMyProject,
  courseDefaultSubmissionDeadline,
  submissionDeadlineDefaultSource,
  refetchQueries,
  onProposeClick,
  onActionError,
}) => {
  const t = useTranslations('course');
  const locale = useLocale();
  const sessionUserId = useUserId();
  const isUser = useIsUser();
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();

  const useAdminJoin = isAdmin && !isUser;

  // Excluded authors stay hidden from peers but remain visible to instructors
  // and admins so they can audit who was dropped from the final submission.
  const canViewExcludedAuthors = isAdmin || isInstructor;

  const getEnterProjectDisabledTooltip = useCallback(
    (project: ProjectRow): string => {
      const effectiveIso = getEffectiveProjectSubmissionDeadlineIso(
        project.submissionDeadline,
        courseDefaultSubmissionDeadline
      );
      if (
        isProjectSubmissionDeadlinePassed(
          project.submissionDeadline,
          courseDefaultSubmissionDeadline
        ) &&
        effectiveIso
      ) {
        return t('projects.table.enter_project_disabled_project_deadline', {
          date: formatSubmissionDeadlineDate(effectiveIso, locale) ?? '',
        });
      }
      if (hasMyProject) {
        return t('projects.table.enter_project_disabled_has_project');
      }
      return '';
    },
    [courseDefaultSubmissionDeadline, hasMyProject, locale, t]
  );

  const [copyTemplate, { loading: copying }] = useRoleMutation(COPY_PROJECT_FROM_TEMPLATE, {
    refetchQueries,
  });
  const [insertRequest, { loading: requestingParticipant }] = useRoleMutation(
    INSERT_PROJECT_AUTHOR_REQUEST,
    {
      refetchQueries,
      ...(isUser ? { context: { role: AuthRoles.user } } : {}),
    }
  );
  const [insertRequestAsAdmin, { loading: requestingAdmin }] = useRoleMutation(
    INSERT_PROJECT_AUTHOR_REQUEST_AS_ADMIN,
    { refetchQueries, context: { role: AuthRoles.admin } }
  );
  const requesting = requestingParticipant || requestingAdmin;

  const handleClaimTemplate = useCallback(
    async (projectId: number) => {
      try {
        const res = await copyTemplate({
          variables: { parentProjectId: projectId, courseId },
        });
        const result = res.data?.copyProjectFromTemplate;
        if (!result?.success) {
          onActionError(result?.error || t('projects.action_failed'));
        }
      } catch (err) {
        onActionError(err instanceof Error ? err.message : t('projects.action_failed'));
      }
    },
    [copyTemplate, courseId, onActionError, t]
  );

  const handleRequestJoin = useCallback(
    async (projectId: number) => {
      try {
        if (useAdminJoin) {
          if (!sessionUserId) {
            onActionError(t('projects.action_failed'));
            return;
          }
          await insertRequestAsAdmin({
            variables: { projectId, userId: sessionUserId },
          });
        } else {
          await insertRequest({ variables: { projectId } });
        }
      } catch (err: unknown) {
        const raw =
          err instanceof ApolloError
            ? [err.message, ...(err.graphQLErrors?.map((e) => e.message) ?? [])].join(' ')
            : err instanceof Error
              ? err.message
              : '';
        const maybeDuplicate = /unique|duplicate key|violates unique constraint/i.test(raw);
        const deadlinePassed = /project_submission_deadline_passed/i.test(raw);
        onActionError(
          maybeDuplicate
            ? t('projects.table.request_blocked_duplicate')
            : deadlinePassed
              ? t('projects.table.request_blocked_deadline')
              : raw || t('projects.action_failed')
        );
      }
    },
    [
      insertRequest,
      insertRequestAsAdmin,
      onActionError,
      sessionUserId,
      t,
      useAdminJoin,
    ]
  );

  const wrapDisabledActionButton = useCallback(
    (button: ReactElement, tooltip: string) =>
      tooltip ? (
        <Tooltip title={tooltip}>
          <span className="inline-flex w-full">{button}</span>
        </Tooltip>
      ) : (
        button
      ),
    []
  );

  const columns = useMemo<ColumnDef<ProjectRow>[]>(
    () => [
      {
        id: 'title',
        header: t('projects.table.title'),
        accessorKey: 'title',
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{row.original.title}</span>
            <StatusChip
              displayKey={getProjectStatusChipKey(row.original)}
              status={row.original.status}
              ratingComment={row.original.ratingComment}
            />
          </div>
        ),
      },
      {
        id: 'authors',
        header: t('projects.table.authors'),
        enableSorting: false,
        cell: ({ row }) => {
          const authors = getDisplayAuthors(row.original.ProjectAuthors, {
            includeExcluded: canViewExcludedAuthors,
          });
          if (authors.length === 0) {
            return <span className="text-label-secondary">{t('projects.table.no_authors')}</span>;
          }
          return (
            <span>
              {formatTruncatedList(authors, (a) =>
                isExcludedAuthor(a)
                  ? t('projects.table.author_excluded_inline', {
                      name: makeFullName(a.User?.firstName ?? '', a.User?.lastName ?? ''),
                    })
                  : makeFullName(a.User?.firstName ?? '', a.User?.lastName ?? '')
              )}
            </span>
          );
        },
      },
      {
        id: 'action',
        header: '',
        enableSorting: false,
        size: 200,
        cell: ({ row }) => {
          const project = row.original;
          if (project.status !== ProjectStatus_enum.PROPOSED) {
            return null;
          }
          const acceptedCount = computeAcceptedCount(project);
          const myAuthorRow = userId
            ? (project.ProjectAuthors ?? []).find((a) => a.userId === userId)
            : undefined;
          const projectDeadlinePassed = isProjectSubmissionDeadlinePassed(
            project.submissionDeadline,
            courseDefaultSubmissionDeadline
          );
          const enterDisabledTooltip = getEnterProjectDisabledTooltip(project);

          if (myAuthorRow?.participationStatus === ProjectParticipationStatus_enum.ACCEPTED) {
            return null;
          }
          if (myAuthorRow?.participationStatus === ProjectParticipationStatus_enum.REQUESTED) {
            return (
              <Button disabled className="w-full">
                {t('projects.table.request_pending')}
              </Button>
            );
          }
          if (myAuthorRow?.participationStatus === ProjectParticipationStatus_enum.DECLINED) {
            return (
              <Button disabled className="w-full">
                {t('projects.table.request_declined')}
              </Button>
            );
          }
          if (acceptedCount === 0) {
            const templateClaimLabel =
              isOnlineCourseProject(project)
                ? t('projects.table.form_new_group_online_course')
                : t('projects.table.form_new_group');
            const claimDisabled =
              copying || hasMyProject || projectDeadlinePassed;
            return wrapDisabledActionButton(
              <Button
                filled
                disabled={claimDisabled}
                onClick={() => handleClaimTemplate(project.id)}
                className="w-full"
              >
                {templateClaimLabel}
              </Button>,
              claimDisabled ? enterDisabledTooltip : ''
            );
          }
          if (
            project.acceptingParticipants &&
            !hasMyProject &&
            !project.projectReviewRequestedAt
          ) {
            const joinDisabled = requesting || projectDeadlinePassed;
            return wrapDisabledActionButton(
              <Button
                disabled={joinDisabled}
                onClick={() => handleRequestJoin(project.id)}
                className="w-full"
              >
                {t('projects.table.request_joining')}
              </Button>,
              joinDisabled ? enterDisabledTooltip : ''
            );
          }
          return null;
        },
      },
    ],
    [
      canViewExcludedAuthors,
      copying,
      courseDefaultSubmissionDeadline,
      getEnterProjectDisabledTooltip,
      handleClaimTemplate,
      handleRequestJoin,
      hasMyProject,
      requesting,
      t,
      userId,
      wrapDisabledActionButton,
    ]
  );

  const expandableRowComponent = useCallback(
    ({ row }: { row: ProjectRow }) => {
      const showFullDetails = shouldShowProjectResourceDownloadLinks(row.status);
      const showExpandedLayout =
        row.status === ProjectStatus_enum.PROPOSED ||
        row.status === ProjectStatus_enum.ONGOING ||
        showFullDetails;
      if (!showExpandedLayout) {
        return null;
      }
      return (
        <div className="p-4 space-y-3">
          <ProjectSubmissionDeadlineBelowTitle
            mode="readonly"
            project={row}
            courseDefaultSubmissionDeadline={courseDefaultSubmissionDeadline}
            defaultDeadlineSource={submissionDeadlineDefaultSource}
          />
          <ProjectPreviewLayout
            project={row}
            showResourceLinks={showFullDetails}
            includeExcludedAuthors={canViewExcludedAuthors}
            titleRow={
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="text-xl font-semibold text-label-primary min-w-0 break-words">{row.title}</h4>
                <StatusChip
                  displayKey={getProjectStatusChipKey(row)}
                  status={row.status}
                  ratingComment={row.ratingComment}
                />
              </div>
            }
          />
        </div>
      );
    },
    [canViewExcludedAuthors, courseDefaultSubmissionDeadline, submissionDeadlineDefaultSource]
  );

  return (
    <TableGrid<ProjectRow>
      columns={columns}
      data={projects}
      loading={loading}
      error={error}
      enablePagination={false}
      showGlobalSearchField={false}
      pageIndex={0}
      onPageChange={() => undefined}
      searchFilter=""
      onSearchFilterChange={() => undefined}
      refetchQueries={refetchQueries}
      addButtonText={showProposeButton ? t('projects.table.propose_button') : undefined}
      onAddButtonClick={showProposeButton ? onProposeClick : undefined}
      expandableRowComponent={expandableRowComponent}
      rounded
    />
  );
};

export default ProjectsTable;
