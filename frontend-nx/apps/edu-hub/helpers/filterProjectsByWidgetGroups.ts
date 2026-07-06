import { CourseGroupOptions_CourseGroupOption } from '../queries/__generated__/CourseGroupOptions';
import { ProjectTileFragment } from '../queries/__generated__/ProjectTileFragment';

/**
 * Filter projects by course group options — mirrors the course widget's client-side
 * group logic, but matches via linked courses (a project may span several courses).
 */
export const filterProjectsByWidgetGroups = (
  projects: ProjectTileFragment[],
  options: {
    selectedGroupIds: number[];
    groupOrder: number | null;
    groupOptions: CourseGroupOptions_CourseGroupOption[];
    groupOptionsLoading: boolean;
    groupOptionsError: boolean;
  }
): ProjectTileFragment[] => {
  const { selectedGroupIds, groupOrder, groupOptions, groupOptionsLoading, groupOptionsError } = options;

  if (selectedGroupIds.length > 0) {
    if (groupOptionsLoading || groupOptionsError) {
      return [];
    }
    const selectedOptions = groupOptions.filter((option) => selectedGroupIds.includes(option.id));
    if (selectedOptions.length === 0) {
      return [];
    }
    return projects.filter((project) =>
      selectedOptions.some((option) =>
        option.programType
          ? project.ProjectCourses.some((pc) => pc.Course?.Program?.type === option.programType)
          : project.ProjectCourses.some((pc) =>
              pc.Course?.CourseGroups.some((cg) => cg.CourseGroupOption.id === option.id)
            )
      )
    );
  }

  if (groupOrder == null || isNaN(groupOrder)) {
    return projects;
  }

  return projects.filter((project) =>
    project.ProjectCourses.some((pc) =>
      pc.Course?.CourseGroups.some((cg) => cg.CourseGroupOption.order === groupOrder)
    )
  );
};
