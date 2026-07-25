import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CircularProgress } from '@mui/material';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { useUserId } from '../../../../hooks/user';
import {
  PROJECTS_BY_COURSE,
  MY_PROJECT_BY_COURSE,
} from '../../../../queries/project';
import {
  ProjectsByCourse,
  ProjectsByCourseVariables,
} from '../../../../queries/__generated__/ProjectsByCourse';
import {
  MyProjectByCourse,
  MyProjectByCourseVariables,
} from '../../../../queries/__generated__/MyProjectByCourse';
import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../__generated__/globalTypes';
import { PARTICIPANT_PROJECT_ROLE_CONTEXT } from './participantProjectRole';

// User can only hold one ACCEPTED project per course while it is in flight.
// Completed / incomplete / published projects do not block proposing or
// requesting to join another project (mirrors the DB trigger
// enforce_one_active_accepted_project_per_course_per_user).
const ACTIVE_PROJECT_STATUSES = new Set<ProjectStatus_enum>([
  ProjectStatus_enum.PROPOSED,
  ProjectStatus_enum.ONGOING,
  ProjectStatus_enum.SUBMITTED,
]);
import NotificationSnackbar from '../../../common/dialogs/NotificationSnackbar';
import { ContentRow } from '../../../common/ContentRow';
import { SectionTitle } from '../../../common/SectionTitle';
import MyProjectPanel from './MyProjectPanel';
import ProjectsTable from './ProjectsTable';
import ProposeProjectDialog from './ProposeProjectDialog';
import {
  CourseProjectSubmissionDefaultSource,
  isProjectSubmissionDeadlinePassed,
} from './projectEffectiveSubmissionDeadline';
import { isOnlineCourseProject } from './projectStatusDisplay';

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

  const projectsQuery = useRoleQuery<ProjectsByCourse, ProjectsByCourseVariables>(
    PROJECTS_BY_COURSE,
    { variables: { courseId }, context: PARTICIPANT_PROJECT_ROLE_CONTEXT }
  );

  const myProjectQuery = useRoleQuery<MyProjectByCourse, MyProjectByCourseVariables>(
    MY_PROJECT_BY_COURSE,
    {
      variables: { courseId, userId: userId ?? '' },
      skip: !userId,
      context: PARTICIPANT_PROJECT_ROLE_CONTEXT,
    }
  );

  const myAcceptedProject = useMemo(
    () =>
      (myProjectQuery.data?.Project ?? []).find((p) =>
        p.ProjectAuthors?.some(
          (a) =>
            a.userId === userId &&
            a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED
        )
      ) ?? null,
    [myProjectQuery.data?.Project, userId]
  );
  const myExcludedProject = useMemo(
    () =>
      (myProjectQuery.data?.Project ?? []).find((p) =>
        p.ProjectAuthors?.some(
          (a) =>
            a.userId === userId &&
            a.participationStatus === ProjectParticipationStatus_enum.EXCLUDED
        )
      ) ?? null,
    [myProjectQuery.data?.Project, userId]
  );
  // Prefer an active ACCEPTED project; otherwise surface the project the user
  // was excluded from so they still get the "you were excluded" notice.
  const myProject = myAcceptedProject ?? myExcludedProject;
  const isExcludedFromMyProject = !myAcceptedProject && Boolean(myExcludedProject);

  // Only an ACCEPTED author occupies the one-active-project slot (mirrors the
  // DB trigger); an excluded author may freely propose or join another project.
  const hasMyActiveProject = Boolean(
    myAcceptedProject &&
      ACTIVE_PROJECT_STATUSES.has(myAcceptedProject.status as ProjectStatus_enum)
  );

  const tableProjects = useMemo(() => {
    const all = projectsQuery.data?.Project ?? [];
    // Hide online-course instances (copied from a template) from the participant
    // table; only the template itself (parentProjectId === null) remains visible.
    const filtered = all.filter(
      (p) => !isOnlineCourseProject(p) || p.parentProjectId == null
    );
    if (!myProject) return filtered;
    return filtered.filter((p) => p.id !== myProject.id);
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

  const showMyProjectPanel = Boolean(myProject && userId);

  const showProposeButton =
    proposalsEnabled &&
    !hasMyActiveProject &&
    Boolean(userId) &&
    !isProjectSubmissionDeadlinePassed(null, effectiveSubmissionDeadline);

  const showProjectsTableSection =
    showMyProjectPanel ||
    tableProjects.length > 0 ||
    showProposeButton;

  const projectsSectionHeading = showMyProjectPanel
    ? t('projects.section_heading')
    : t('projects.section_heading_all');

  if (!showMyProjectPanel && !showProjectsTableSection) {
    return null;
  }

  return (
    <div className="mt-24 mb-24 min-w-0 mx-6 xl:mx-0">
      {showMyProjectPanel && userId ? (
        <>
          <SectionTitle>{t('projects.my_project.heading')}</SectionTitle>
          <ContentRow className="mb-12 text-label-primary bg-fill-primary light rounded-2xl p-4 min-w-0">
            <div className="flex flex-col w-full min-w-0">
              <MyProjectPanel
                project={myProject!}
                userId={userId}
                isExcludedAuthor={isExcludedFromMyProject}
                courseDefaultSubmissionDeadline={effectiveSubmissionDeadline}
                submissionDeadlineDefaultSource={submissionDeadlineDefaultSource}
                refetchQueries={REFETCH_QUERIES}
                onActionError={handleActionError}
              />
            </div>
          </ContentRow>
        </>
      ) : null}

      {showProjectsTableSection ? (
        <div className="w-full min-w-0">
          <SectionTitle>{projectsSectionHeading}</SectionTitle>
          <ProjectsTable
            projects={tableProjects}
            loading={projectsQuery.loading}
            error={projectsQuery.error}
            courseId={courseId}
            userId={userId ?? undefined}
            showProposeButton={showProposeButton}
            hasMyProject={hasMyActiveProject}
            courseDefaultSubmissionDeadline={effectiveSubmissionDeadline}
            submissionDeadlineDefaultSource={submissionDeadlineDefaultSource}
            refetchQueries={REFETCH_QUERIES}
            onProposeClick={() => setProposeDialogOpen(true)}
            onActionError={handleActionError}
          />
        </div>
      ) : null}

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
