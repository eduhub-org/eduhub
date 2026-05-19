import { FC, useCallback, useMemo } from 'react';
import { ApolloError } from '@apollo/client';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import TableGrid from '../../../common/TableGrid';
import { Button } from '../../../common/Button';
import {
  COPY_PROJECT_FROM_TEMPLATE,
  INSERT_PROJECT_AUTHOR_REQUEST,
} from '../../../../queries/project';
import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../__generated__/globalTypes';
import { formatTruncatedList, makeFullName } from '../../../../helpers/util';
import StatusChip from './StatusChip';
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
  proposalsEnabled: boolean;
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
  proposalsEnabled,
  hasMyProject,
  courseDefaultSubmissionDeadline,
  submissionDeadlineDefaultSource,
  refetchQueries,
  onProposeClick,
  onActionError,
}) => {
  const t = useTranslations('course');

  const [copyTemplate, { loading: copying }] = useRoleMutation(COPY_PROJECT_FROM_TEMPLATE, {
    refetchQueries,
  });
  const [insertRequest, { loading: requesting }] = useRoleMutation(
    INSERT_PROJECT_AUTHOR_REQUEST,
    { refetchQueries }
  );

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
        await insertRequest({ variables: { projectId } });
      } catch (err: unknown) {
        const raw =
          err instanceof ApolloError
            ? [err.message, ...(err.graphQLErrors?.map((e) => e.message) ?? [])].join(' ')
            : err instanceof Error
              ? err.message
              : '';
        const maybeDuplicate = /unique|duplicate key|violates unique constraint/i.test(raw);
        onActionError(
          maybeDuplicate ? t('projects.table.request_blocked_duplicate') : raw || t('projects.action_failed')
        );
      }
    },
    [insertRequest, onActionError, t]
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
            <StatusChip status={row.original.status} />
          </div>
        ),
      },
      {
        id: 'authors',
        header: t('projects.table.authors'),
        enableSorting: false,
        cell: ({ row }) => {
          const authors = (row.original.ProjectAuthors ?? []).filter(
            (a) => a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED
          );
          if (authors.length === 0) {
            return <span className="text-label-secondary">{t('projects.table.no_authors')}</span>;
          }
          return (
            <span>
              {formatTruncatedList(authors, (a) =>
                makeFullName(a.User?.firstName ?? '', a.User?.lastName ?? '')
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
              project.type === 'ONLINE_COURSE' ||
              project.ProjectType?.value === 'ONLINE_COURSE'
                ? t('projects.table.form_new_group_online_course')
                : t('projects.table.form_new_group');
            return (
              <Button
                filled
                disabled={copying || hasMyProject}
                onClick={() => handleClaimTemplate(project.id)}
                className="w-full"
              >
                {templateClaimLabel}
              </Button>
            );
          }
          if (project.acceptingParticipants && !hasMyProject) {
            return (
              <Button
                disabled={requesting}
                onClick={() => handleRequestJoin(project.id)}
                className="w-full"
              >
                {t('projects.table.request_joining')}
              </Button>
            );
          }
          return null;
        },
      },
    ],
    [copying, handleClaimTemplate, handleRequestJoin, hasMyProject, requesting, t, userId]
  );

  const expandableRowComponent = useCallback(
    ({ row }: { row: ProjectRow }) => {
      const showFullDetails =
        row.status === ProjectStatus_enum.COMPLETED ||
        row.status === ProjectStatus_enum.PUBLISHED;
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
            titleRow={
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="text-xl font-semibold text-label-primary min-w-0 break-words">{row.title}</h4>
                <StatusChip status={row.status} />
              </div>
            }
          />
        </div>
      );
    },
    [courseDefaultSubmissionDeadline, submissionDeadlineDefaultSource]
  );

  const showAddButton = proposalsEnabled && !hasMyProject && Boolean(userId);

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
      addButtonText={showAddButton ? t('projects.table.propose_button') : undefined}
      onAddButtonClick={showAddButton ? onProposeClick : undefined}
      expandableRowComponent={expandableRowComponent}
    />
  );
};

export default ProjectsTable;
