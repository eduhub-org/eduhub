import Link from 'next/link';
import { FC } from 'react';
import { useTranslations } from 'next-intl';

import { ProjectStatus_enum } from '../../../__generated__/globalTypes';
import { ProjectTileFragment } from '../../../queries/__generated__/ProjectTileFragment';
import { TileBase } from './TileBase';
import { ProjectAvatars } from './ProjectAvatars';
import { projectCourseLine, projectMentorName, projectHref } from './projectTileHelpers';

export type ProjectTileContext = 'public' | 'withinCourse';

interface ProjectTileProps {
  project: ProjectTileFragment;
  context: ProjectTileContext;
  /** Course context for the link / course line when rendered within a course. */
  courseId?: number;
}

export const ProjectTile: FC<ProjectTileProps> = ({ project, context, courseId }) => {
  const t = useTranslations('project');
  const isPublished = project.status === ProjectStatus_enum.PUBLISHED;
  const courseLine = projectCourseLine(project, courseId);
  const mentorName = projectMentorName(project);
  const href = projectHref(project, context, courseId);

  return (
    <Link href={href}>
      <TileBase coverImage={project.coverImageUrl ?? null} title={project.title}>
        {isPublished ? (
          // Tile A — published showcase
          <>
            <div className="flex justify-between items-center mb-3 text-sm tracking-wider text-label-primary">
              <span className="truncate">{courseLine}</span>
              <span className="flex items-center gap-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-success" />
                {t('status.published')}
              </span>
            </div>
            <span className="text-lg mb-auto line-clamp-3 text-label-primary">{project.tagline}</span>
            <div className="flex justify-between items-center text-xs tracking-wider text-label-primary">
              <ProjectAvatars authors={project.ProjectAuthors} />
              <span className="uppercase truncate">{project.Organization?.name}</span>
            </div>
          </>
        ) : (
          // Tile B — open project template
          <>
            <span className="text-xs uppercase tracking-widest text-label-secondary mb-2">
              {t('tile.template_eyebrow')}
            </span>
            <span className="text-lg mb-auto line-clamp-2 text-label-primary">
              {context === 'withinCourse' ? courseLine : project.tagline ?? courseLine}
            </span>
            {mentorName ? (
              <span className="text-sm text-label-secondary mb-3 truncate">
                {t('tile.mentored_by', { name: mentorName })}
              </span>
            ) : null}
            <span className="flex items-center justify-between text-sm font-semibold text-brand">
              {context === 'withinCourse' ? t('cta.view_and_join') : t('cta.apply_for_course')}
              <span aria-hidden>→</span>
            </span>
          </>
        )}
      </TileBase>
    </Link>
  );
};
