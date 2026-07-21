import Link from 'next/link';
import { FC, memo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar } from 'lucide-react';

import { ProjectTileFragment } from '../../../queries/__generated__/ProjectTileFragment';
import { TileBase } from './TileBase';
import { ProjectAvatars } from './ProjectAvatars';
import { BadgeChip, pickPrimaryBadge } from '../badges/ProjectBadges';
import { projectCourseLine, projectMentorName, projectHref, formatSubmittedDate } from './projectTileHelpers';
import { isOpenTemplate, isProjectPublished } from '../../pages/CourseContent/Projects/projectStatusDisplay';
import { getWidgetBaseUrl } from './widgetBaseUrl';

export type ProjectTileContext = 'public' | 'withinCourse';

interface ProjectTileProps {
  project: ProjectTileFragment;
  context: ProjectTileContext;
  /** Course context for the link / course line when rendered within a course. */
  courseId?: number;
  /**
   * Widget embed mode: link to an absolute EduHub URL and open in a new tab,
   * since the tile is rendered inside a third-party iframe.
   */
  isWidget?: boolean;
}

const ProjectTileComponent: FC<ProjectTileProps> = ({ project, context, courseId, isWidget = false }) => {
  const t = useTranslations('project');
  const locale = useLocale();
  // A published project is shown as a showcase unless it is still an open
  // template (a published, claimable template renders the template tile).
  const isShowcase = isProjectPublished(project) && !isOpenTemplate(project);
  const courseLine = projectCourseLine(project, courseId);
  const mentorName = projectMentorName(project);
  const href = projectHref(project, context, courseId);
  const primaryBadge = pickPrimaryBadge(project.ProjectBadges);
  const submittedLabel = formatSubmittedDate(project.submittedAt, locale);

  const tile = (
    <TileBase coverImage={project.coverImageUrl ?? null} title={project.title}>
        {isShowcase ? (
          // Tile A — published showcase
          <>
            <div className="flex justify-between items-center gap-2 mb-3 text-sm tracking-wider text-label-primary">
              <span className="truncate">{courseLine}</span>
              {submittedLabel && (
                <span className="flex items-center gap-1 shrink-0 text-label-secondary">
                  <Calendar size={14} className="shrink-0" />
                  {t('submitted_on', { date: submittedLabel })}
                </span>
              )}
            </div>
            <span className="text-lg mb-auto line-clamp-3 text-label-primary">{project.tagline}</span>
            <div className="flex justify-between items-center gap-2 text-xs text-label-secondary">
              <ProjectAvatars authors={project.ProjectAuthors} size={40} />
              {primaryBadge && <BadgeChip badge={primaryBadge} className="shrink-0" />}
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
  );

  if (isWidget) {
    return (
      <a href={`${getWidgetBaseUrl()}${href}`} target="_blank" rel="noopener noreferrer" className="block">
        {tile}
      </a>
    );
  }

  return <Link href={href}>{tile}</Link>;
};

export const ProjectTile = memo(ProjectTileComponent);
