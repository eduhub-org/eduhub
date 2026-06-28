import { FC, useMemo } from 'react';
import { useQuery } from '@apollo/client';

import { AuthRoles } from '../../../types/enums';
import {
  HOME_PROJECT_TILES_ALL,
  HOME_PROJECT_TILES_BY_GROUPS,
} from '../../../queries/projectTile';
import { HomeProjectTilesAll } from '../../../queries/__generated__/HomeProjectTilesAll';
import {
  HomeProjectTilesByGroups,
  HomeProjectTilesByGroupsVariables,
} from '../../../queries/__generated__/HomeProjectTilesByGroups';
import { CourseGroupOptions_CourseGroupOption } from '../../../queries/__generated__/CourseGroupOptions';
import ProjectTileSlider from './ProjectTileSlider';

interface HomeProjectSliderProps {
  option: CourseGroupOptions_CourseGroupOption;
  title: string;
}

/**
 * Renders a single home project-slider row (a CourseGroupOption with
 * contentType = 'PROJECT'). Pulls its membership from the selected groups, or
 * all home-eligible projects when no groups are selected.
 */
const HomeProjectSlider: FC<HomeProjectSliderProps> = ({ option, title }) => {
  const courseGroupIds = useMemo(
    () => option.SelectedCourseGroups.map((s) => s.courseGroupOptionId),
    [option.SelectedCourseGroups]
  );
  const projectGroupIds = useMemo(
    () => option.SelectedProjectGroups.map((s) => s.projectGroupOptionId),
    [option.SelectedProjectGroups]
  );
  const hasGroupSelection = courseGroupIds.length > 0 || projectGroupIds.length > 0;

  const { data: allData, loading: allLoading, error: allError } = useQuery<HomeProjectTilesAll>(
    HOME_PROJECT_TILES_ALL,
    {
      context: { role: AuthRoles.anonymous },
      skip: hasGroupSelection,
    }
  );

  const { data: groupData, loading: groupLoading, error: groupError } = useQuery<
    HomeProjectTilesByGroups,
    HomeProjectTilesByGroupsVariables
  >(HOME_PROJECT_TILES_BY_GROUPS, {
    variables: { courseGroupIds, projectGroupIds },
    context: { role: AuthRoles.anonymous },
    skip: !hasGroupSelection,
  });

  const loading = hasGroupSelection ? groupLoading : allLoading;
  const error = hasGroupSelection ? groupError : allError;
  const projects = (hasGroupSelection ? groupData?.Project : allData?.Project) ?? [];

  const heading = <h2 className="text-2xl font-semibold text-left ml-3 md:ml-0">{title}</h2>;

  // Degrade gracefully on the public homepage: log the failure but don't render a
  // broken/error section to every visitor.
  if (error) {
    console.warn('HomeProjectSlider failed to load projects', error);
    return null;
  }

  if (loading) {
    return (
      <>
        {heading}
        <div className="mt-2 mb-12">
          <div className="relative h-[431px] animate-pulse bg-bg-card rounded-2xl" />
        </div>
      </>
    );
  }

  if (projects.length === 0) return null;

  return (
    <>
      {heading}
      <div className="mt-2 mb-12">
        <ProjectTileSlider projects={projects} context="public" />
      </div>
    </>
  );
};

export default HomeProjectSlider;
