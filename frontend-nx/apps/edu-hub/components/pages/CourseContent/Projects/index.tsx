import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CircularProgress } from '@mui/material';
import { useAuthedQuery } from '../../../../hooks/authedQuery';
import { useUserId } from '../../../../hooks/user';
import {
  PROJECTS_BY_COURSE,
  MY_PROJECT_BY_COURSE,
  PROJECT_TYPES,
} from '../../../../queries/project';
import {
  ProjectsByCourse,
  ProjectsByCourseVariables,
} from '../../../../queries/__generated__/ProjectsByCourse';
import {
  MyProjectByCourse,
  MyProjectByCourseVariables,
} from '../../../../queries/__generated__/MyProjectByCourse';
import { ProjectTypes } from '../../../../queries/__generated__/ProjectTypes';
import { ProjectParticipationStatus_enum } from '../../../../__generated__/globalTypes';
import NotificationSnackbar from '../../../common/dialogs/NotificationSnackbar';
import { ContentRow } from '../../../common/ContentRow';
import MyProjectPanel from './MyProjectPanel';
import ProjectsTable from './ProjectsTable';
import ProposeProjectDialog from './ProposeProjectDialog';
import { CourseProjectSubmissionDefaultSource } from './projectEffectiveSubmissionDeadline';

interface ProjectsProps {
  courseId: number;
  defaultProjectType: string | null;
  effectiveSubmissionDeadline: string | null | undefined;
  submissionDeadlineDefaultSource: CourseProjectSubmissionDefaultSource;
  proposalsEnabled: boolean;
}

const REFETCH_QUERIES = ['ProjectsByCourse', 'MyProjectByCourse'];

const Projects: FC<ProjectsProps> = ({
  courseId,
  defaultProjectType,
  effectiveSubmissionDeadline,
  submissionDeadlineDefaultSource,
  proposalsEnabled,
}) => {
  const t = useTranslations('course');
  const userId = useUserId();

  const [proposeDialogOpen, setProposeDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const projectsQuery = useAuthedQuery<ProjectsByCourse, ProjectsByCourseVariables>(
    PROJECTS_BY_COURSE,
    { variables: { courseId } }
  );

  const myProjectQuery = useAuthedQuery<MyProjectByCourse, MyProjectByCourseVariables>(
    MY_PROJECT_BY_COURSE,
    {
      variables: { courseId, userId: userId ?? '' },
      skip: !userId,
    }
  );

  const projectTypesQuery = useAuthedQuery<ProjectTypes>(PROJECT_TYPES);

  const myProject = myProjectQuery.data?.Project?.[0] ?? null;

  const tableProjects = useMemo(() => {
    const all = projectsQuery.data?.Project ?? [];
    if (!myProject) return all;
    return all.filter((p) => p.id !== myProject.id);
  }, [projectsQuery.data?.Project, myProject]);

  const handleProposeSuccess = useCallback(() => {
    setProposeDialogOpen(false);
    projectsQuery.refetch();
    if (userId) {
      myProjectQuery.refetch();
    }
  }, [projectsQuery, myProjectQuery, userId]);

  const handleActionError = useCallback((message: string) => {
    setErrorMessage(message);
  }, []);

  const initialLoading =
    projectsQuery.loading && !projectsQuery.data;

  if (initialLoading) {
    return (
      <div className="flex justify-center py-6">
        <CircularProgress />
      </div>
    );
  }

  const myProjectAcceptedAuthor =
    myProject?.ProjectAuthors?.find(
      (a) =>
        a.userId === userId &&
        a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED
    ) ?? null;

  const projectTypes = projectTypesQuery.data?.ProjectType ?? [];

  const showMyProjectPanel =
    Boolean(myProject && myProjectAcceptedAuthor && userId);

  return (
    <div className="w-full mt-24 mb-24 min-w-0">
      {showMyProjectPanel && userId ? (
        <ContentRow className="mb-8 text-label-primary bg-fill-primary light px-8 py-8 w-full min-w-0">
          <div className="flex flex-col w-full min-w-0">
            <MyProjectPanel
              project={myProject!}
              userId={userId}
              projectTypes={projectTypes}
              courseDefaultSubmissionDeadline={effectiveSubmissionDeadline}
              submissionDeadlineDefaultSource={submissionDeadlineDefaultSource}
              refetchQueries={REFETCH_QUERIES}
              onActionError={handleActionError}
            />
          </div>
        </ContentRow>
      ) : null}

      <div className="w-full min-w-0 px-8">
        <h2 className="text-2xl font-semibold text-label-primary mb-6">
          {t('projects.section_heading')}
        </h2>
        <ProjectsTable
          projects={tableProjects}
          loading={projectsQuery.loading}
          error={projectsQuery.error}
          courseId={courseId}
          userId={userId ?? undefined}
          proposalsEnabled={proposalsEnabled}
          hasMyProject={Boolean(myProject)}
          courseDefaultSubmissionDeadline={effectiveSubmissionDeadline}
          submissionDeadlineDefaultSource={submissionDeadlineDefaultSource}
          refetchQueries={REFETCH_QUERIES}
          onProposeClick={() => setProposeDialogOpen(true)}
          onActionError={handleActionError}
        />
      </div>

      {userId ? (
        <ProposeProjectDialog
          open={proposeDialogOpen}
          onClose={() => setProposeDialogOpen(false)}
          onSuccess={handleProposeSuccess}
          courseId={courseId}
          userId={userId}
          defaultProjectType={defaultProjectType}
          refetchQueries={REFETCH_QUERIES}
        />
      ) : null}

      <NotificationSnackbar
        open={Boolean(errorMessage)}
        onClose={() => setErrorMessage('')}
        message={errorMessage}
        duration={6000}
      />
    </div>
  );
};

export default Projects;
