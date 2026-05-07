import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CircularProgress } from '@mui/material';
import { useAuthedQuery } from '../../../../hooks/authedQuery';
import { useUserId } from '../../../../hooks/user';
import {
  PROJECTS_BY_COURSE,
  MY_PROJECT_BY_COURSE,
  PROJECT_TYPES,
  PROJECT_DOCUMENTATION_TEMPLATES,
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
import { ProjectDocumentationTemplates } from '../../../../queries/__generated__/ProjectDocumentationTemplates';
import { ProjectParticipationStatus_enum } from '../../../../__generated__/globalTypes';
import NotificationSnackbar from '../../../common/dialogs/NotificationSnackbar';
import MyProjectPanel from './MyProjectPanel';
import ProjectsTable from './ProjectsTable';
import ProposeProjectDialog from './ProposeProjectDialog';

interface ProjectsProps {
  courseId: number;
  defaultProjectType: string | null;
  effectiveSubmissionDeadline: string | null | undefined;
  proposalsEnabled: boolean;
}

const REFETCH_QUERIES = ['ProjectsByCourse', 'MyProjectByCourse'];

const Projects: FC<ProjectsProps> = ({
  courseId,
  defaultProjectType,
  effectiveSubmissionDeadline,
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
  const documentationTemplatesQuery = useAuthedQuery<ProjectDocumentationTemplates>(
    PROJECT_DOCUMENTATION_TEMPLATES
  );

  const myProject = myProjectQuery.data?.Project?.[0] ?? null;

  const tableProjects = useMemo(() => {
    const all = projectsQuery.data?.Project ?? [];
    if (!myProject) return all;
    return all.filter((p) => p.id !== myProject.id);
  }, [projectsQuery.data?.Project, myProject]);

  const submissionDeadline = useMemo(
    () => (effectiveSubmissionDeadline ? new Date(effectiveSubmissionDeadline) : null),
    [effectiveSubmissionDeadline]
  );

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
  const documentationTemplates =
    documentationTemplatesQuery.data?.ProjectDocumentationTemplate ?? [];

  return (
    <div className="space-y-6 my-12">
      <div>
        <h2 className="text-2xl font-semibold text-white">
          {t('projects.section_heading')}
        </h2>
      </div>

      {myProject && myProjectAcceptedAuthor && userId ? (
        <MyProjectPanel
          project={myProject}
          userId={userId}
          projectTypes={projectTypes}
          documentationTemplates={documentationTemplates}
          submissionDeadline={submissionDeadline}
          refetchQueries={REFETCH_QUERIES}
          onActionError={handleActionError}
        />
      ) : null}

      <ProjectsTable
        projects={tableProjects}
        loading={projectsQuery.loading}
        error={projectsQuery.error}
        courseId={courseId}
        userId={userId ?? undefined}
        proposalsEnabled={proposalsEnabled}
        hasMyProject={Boolean(myProject)}
        refetchQueries={REFETCH_QUERIES}
        onProposeClick={() => setProposeDialogOpen(true)}
        onActionError={handleActionError}
      />

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
