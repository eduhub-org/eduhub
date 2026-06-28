import { ProjectTileFragment } from '../../../queries/__generated__/ProjectTileFragment';
import type { ProjectTileContext } from './ProjectTile';

/**
 * The course line shown on a project tile, e.g. "Web Development · WS24".
 * When a courseId is provided (within-course context) the matching course is
 * preferred, otherwise the first linked course is used.
 */
export const projectCourseLine = (project: ProjectTileFragment, courseId?: number): string => {
  const projectCourse =
    (courseId != null && project.ProjectCourses.find((pc) => pc.courseId === courseId)) ||
    project.ProjectCourses[0];
  if (!projectCourse) return project.Organization?.name ?? '';
  const { Course } = projectCourse;
  const term = Course.Program?.shortTitle;
  return term ? `${Course.title} · ${term}` : Course.title;
};

export const projectMentorName = (project: ProjectTileFragment): string | null => {
  const mentor = project.ProjectMentors[0]?.User;
  if (!mentor) return null;
  return `${mentor.firstName} ${mentor.lastName}`.trim();
};

export const projectHref = (
  project: ProjectTileFragment,
  context: ProjectTileContext,
  courseId?: number
): string =>
  context === 'withinCourse' && courseId != null
    ? `/course/${courseId}/project/${project.id}`
    : `/project/${project.id}`;
