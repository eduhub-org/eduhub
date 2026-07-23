import { AuthRoles } from '../../../../types/enums';

/**
 * Course-page project UI is a participant flow. Instructors (and admins who are
 * also enrolled) still use useCurrentRole() → instructor/admin by default, but
 * Hasura's `instructor` inherited role deliberately omits `user_access` (ProjectAuthor
 * insert presets conflict). Without pinning `user`, ProjectsByCourse falls back to
 * the anonymous showcase filter and copyProjectFromTemplate is unavailable.
 */
export const PARTICIPANT_PROJECT_ROLE_CONTEXT = {
  role: AuthRoles.user,
} as const;
