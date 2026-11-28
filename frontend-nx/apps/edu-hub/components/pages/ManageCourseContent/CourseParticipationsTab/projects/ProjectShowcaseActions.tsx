import { FC, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useRoleMutation } from '../../../../../hooks/authedMutation';
import { useCurrentRole } from '../../../../../hooks/authentication';
import { useManagementRoleContext } from '../../../../../hooks/managementRole';
import { AuthRoles } from '../../../../../types/enums';
import { ProjectStatus_enum } from '../../../../../__generated__/globalTypes';
import { UPDATE_PROJECT_PUBLISHED } from '../../../../../queries/project';
import {
  UpdateProjectPublished,
  UpdateProjectPublishedVariables,
} from '../../../../../queries/__generated__/UpdateProjectPublished';
import { Button } from '../../../../common/Button';
import { DialogShell } from '../../../../common/dialogs/DialogShell';
import NotificationSnackbar from '../../../../common/dialogs/NotificationSnackbar';
import ProjectPreviewLayout from '../../../CourseContent/Projects/ProjectPreviewLayout';
import ProjectReviewComment from '../../../CourseContent/Projects/ProjectReviewComment';
import {
  canPublishProject,
  isOnlineCourseProject,
  isOpenTemplate,
  shouldShowProjectResourceDownloadLinks,
} from '../../../CourseContent/Projects/projectStatusDisplay';
import { ProjectRow } from '../../../CourseContent/Projects/types';

/**
 * Projects the publish button is offered for: passed projects (except online courses), open
 * Project Templates, and anything already published, so it can be taken out again. Whether
 * publishing is actually allowed also needs the team's consent (canPublishProject).
 */
const offersPublishing = (project: ProjectRow): boolean =>
  project.published ||
  isOpenTemplate(project) ||
  (project.status === ProjectStatus_enum.COMPLETED && !isOnlineCourseProject(project));

interface ProjectShowcaseActionsProps {
  project: ProjectRow;
  /** Operation names of the grid's row query, reloaded after publishing. */
  refetchQueries: string[];
  onError: (message: string) => void;
  projectPageHref?: string;
}

/**
 * Row actions for the public showcase: a read-only preview of the project, and publishing or
 * unpublishing it. Only Admins can publish (Org Admins can't update `published`), so that button
 * shows only when the grid runs under the admin management role. Without the team's publication
 * consent the publish button stays visible but disabled, with a note saying why (the database
 * refuses it too); unpublishing is always possible.
 */
const ProjectShowcaseActions: FC<ProjectShowcaseActionsProps> = ({
  project,
  refetchQueries,
  onError,
  projectPageHref,
}) => {
  const t = useTranslations('manageCourse');
  // The course manage page sets a management role only for Org Admins; Admins and instructors
  // manage it under their session role.
  const managementRole = useManagementRoleContext();
  const currentRole = useCurrentRole();
  const isAdmin = (managementRole ?? currentRole) === AuthRoles.admin;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const consentNoteId = `publish-consent-note-${project.id}`;
  const publishBlocked = !project.published && !canPublishProject(project);

  const [updatePublished, { loading }] = useRoleMutation<
    UpdateProjectPublished,
    UpdateProjectPublishedVariables
  >(UPDATE_PROJECT_PUBLISHED, { refetchQueries });

  const handleTogglePublished = useCallback(async () => {
    const publishing = !project.published;
    try {
      await updatePublished({
        variables: {
          itemId: project.id,
          published: publishing,
          // Publishing fulfils the recommendation; unpublishing leaves it as it is.
          suggestedForPublication: publishing ? false : project.suggestedForPublication ?? false,
        },
      });
      setSuccessMessage(
        t(publishing ? 'projects.notifications.publish_success' : 'projects.notifications.unpublish_success')
      );
    } catch (err) {
      console.error('Error updating project publication:', err);
      // The database refuses publishing without consent; the list may predate a withdrawal.
      const refusedForConsent =
        err instanceof Error && err.message.includes('project_publication_requires_consent');
      onError(
        t(refusedForConsent ? 'projects.actions.publish_needs_consent' : 'projects.notifications.publish_failed')
      );
    }
  }, [onError, project, t, updatePublished]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <Button onClick={() => setPreviewOpen(true)} className="w-full">
        {t('projects.actions.preview')}
      </Button>
      {isAdmin && offersPublishing(project) ? (
        <>
          <Button
            onClick={handleTogglePublished}
            disabled={loading || publishBlocked}
            className="w-full"
            aria-describedby={publishBlocked ? consentNoteId : undefined}
          >
            {project.published ? t('projects.actions.unpublish') : t('projects.actions.publish')}
          </Button>
          {publishBlocked ? (
            <p id={consentNoteId} className="text-xs text-label-secondary">
              {t('projects.actions.publish_needs_consent')}
            </p>
          ) : null}
        </>
      ) : null}

      <DialogShell
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={project.title}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <ProjectReviewComment ratingComment={project.ratingComment} />
          <ProjectPreviewLayout
            project={project}
            showResourceLinks={shouldShowProjectResourceDownloadLinks(project.status)}
            includeExcludedAuthors
            projectPageHref={projectPageHref}
          />
        </div>
      </DialogShell>

      <NotificationSnackbar
        open={Boolean(successMessage)}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
        duration={4000}
      />
    </div>
  );
};

export default ProjectShowcaseActions;
