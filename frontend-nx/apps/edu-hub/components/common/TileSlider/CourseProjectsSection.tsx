import { FC, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslations } from 'next-intl';

import { AuthRoles } from '../../../types/enums';
import {
  COURSE_SERIES_INFO,
  COURSE_PUBLISHED_PROJECT_TILES,
  COURSE_TEMPLATE_PROJECT_TILES,
} from '../../../queries/projectTile';
import { CourseSeriesInfo, CourseSeriesInfoVariables } from '../../../queries/__generated__/CourseSeriesInfo';
import {
  CoursePublishedProjectTiles,
  CoursePublishedProjectTilesVariables,
} from '../../../queries/__generated__/CoursePublishedProjectTiles';
import {
  CourseTemplateProjectTiles,
  CourseTemplateProjectTilesVariables,
} from '../../../queries/__generated__/CourseTemplateProjectTiles';
import TileSlider from '.';
import { ProjectTile } from './ProjectTile';

interface CourseProjectsSectionProps {
  courseId: number;
}

/**
 * Auto-rendered on the course page (no config). Shows open project templates for
 * this course and published showcase projects from past iterations of the same
 * course series.
 */
const CourseProjectsSection: FC<CourseProjectsSectionProps> = ({ courseId }) => {
  const t = useTranslations('project');
  const anonymous = { role: AuthRoles.anonymous };
  // Program.lectureEnd is a `date` column, so compare against a date-only value.
  const now = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { data: seriesData } = useQuery<CourseSeriesInfo, CourseSeriesInfoVariables>(COURSE_SERIES_INFO, {
    variables: { id: courseId },
    context: anonymous,
  });
  const courseSeriesId = seriesData?.Course?.[0]?.courseSeriesId ?? null;

  const { data: publishedData } = useQuery<CoursePublishedProjectTiles, CoursePublishedProjectTilesVariables>(
    COURSE_PUBLISHED_PROJECT_TILES,
    {
      variables: { courseSeriesId: courseSeriesId ?? 0, now },
      context: anonymous,
      skip: courseSeriesId == null,
    }
  );

  const { data: templateData } = useQuery<CourseTemplateProjectTiles, CourseTemplateProjectTilesVariables>(
    COURSE_TEMPLATE_PROJECT_TILES,
    {
      variables: { courseId },
      context: anonymous,
    }
  );

  const published = publishedData?.Project ?? [];
  const templates = templateData?.Project ?? [];

  if (published.length === 0 && templates.length === 0) return null;

  return (
    <div className="flex flex-col space-y-12 text-white">
      {templates.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-left mb-2">{t('course_section.open_templates')}</h2>
          <TileSlider
            items={templates}
            renderTile={(project) => <ProjectTile project={project} context="withinCourse" courseId={courseId} />}
          />
        </div>
      )}
      {published.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-left mb-2">{t('course_section.past_projects')}</h2>
          <TileSlider
            items={published}
            renderTile={(project) => <ProjectTile project={project} context="withinCourse" courseId={courseId} />}
          />
        </div>
      )}
    </div>
  );
};

export default CourseProjectsSection;
