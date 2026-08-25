import { AuthRoles } from '../../../../types/enums';

/**
 * Course-page project UI is a participant flow. Instructors (and admins who are
 * also enrolled) still use useCurrentRole() → instructor/admin by default.
 *
 * Hasura's `instructor` inherited role does include `user_access`, but three tables
 * carry an explicit `- role: instructor` permission (ProjectAuthor insert, Project
 * update, ProjectCourse insert) because the two parent roles define those mutations
 * differently. An explicit permission on an inherited role overrides the merge, so
 * under `instructor` those tables behave exactly like `instructor_access`: no
 * `set: userId` preset, no `set: submittedBy` preset, no `projectReviewRequestedAt`
 * column. InsertSelfProposedProject and InsertProjectAuthorRequest rely on the userId
 * preset and MarkProjectReviewRequested writes projectReviewRequestedAt, so all of
 * them fail unless the request is pinned to `user`.
 *
 * Keep the pin. Removing it also drops ProjectsByCourse back to the anonymous
 * showcase filter and makes copyProjectFromTemplate unavailable.
 */
export const PARTICIPANT_PROJECT_ROLE_CONTEXT = {
  role: AuthRoles.user,
} as const;
