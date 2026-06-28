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
}

/**
 * Renders a single home project-slider row (a CourseGroupOption with
 * contentType = 'PROJECT'). Pulls its membership from the selected groups, or
 * all home-eligible projects when no groups are selected.
 */
const HomeProjectSlider: FC<HomeProjectSliderProps> = ({ option }) => {
  const courseGroupIds = useMemo(
    () => option.SelectedCourseGroups.map((s) => s.courseGroupOptionId),
    [option.SelectedCourseGroups]
  );
  const projectGroupIds = useMemo(
    () => option.SelectedProjectGroups.map((s) => s.projectGroupOptionId),
    [option.SelectedProjectGroups]
  );
  const hasGroupSelection = courseGroupIds.length > 0 || projectGroupIds.length > 0;

  const { data: allData } = useQuery<HomeProjectTilesAll>(HOME_PROJECT_TILES_ALL, {
    context: { role: AuthRoles.anonymous },
    skip: hasGroupSelection,
  });

  const { data: groupData } = useQuery<HomeProjectTilesByGroups, HomeProjectTilesByGroupsVariables>(
    HOME_PROJECT_TILES_BY_GROUPS,
    {
      variables: { courseGroupIds, projectGroupIds },
      context: { role: AuthRoles.anonymous },
      skip: !hasGroupSelection,
    }
  );

  const projects = (hasGroupSelection ? groupData?.Project : allData?.Project) ?? [];

  if (projects.length === 0) return null;

  return (
    <>
      <h2 className="text-2xl font-semibold text-left ml-3 md:ml-0">{option.title}</h2>
      <div className="mt-2 mb-12">
        <ProjectTileSlider projects={projects} context="public" />
      </div>
    </>
  );
};

export default HomeProjectSlider;
