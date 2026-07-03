import { ProjectTileFragment } from '../../../queries/__generated__/ProjectTileFragment';
import type { ProjectTileContext } from './ProjectTile';

/**
 * The course line shown on a project tile, e.g. "Web Development".
 * When a courseId is provided (within-course context) the matching course is
 * preferred, otherwise the first linked course is used. The program / term is
 * intentionally omitted — only the course name is shown.
 */
export const projectCourseLine = (project: ProjectTileFragment, courseId?: number): string => {
  // Course can be null at runtime even though the FK is non-null: anonymous
  // visitors only see courses whose program is published, so a public project
  // linked to a hidden course resolves Course to null. Prefer a link whose
  // course is actually visible, then fall back to the organization name.
  const projectCourse =
    (courseId != null && project.ProjectCourses.find((pc) => pc.courseId === courseId && pc.Course)) ||
    project.ProjectCourses.find((pc) => pc.Course);
  return projectCourse?.Course?.title ?? project.Organization?.name ?? '';
};

/**
 * Formats a project's submission timestamp as a short month + year label,
 * e.g. "Mar 2025" / "März 2025". Returns null when there is no valid date.
 */
export const formatSubmittedDate = (submittedAt: string | null | undefined, locale: string): string | null => {
  if (!submittedAt) return null;
  const date = new Date(submittedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { month: 'short', year: 'numeric' });
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
