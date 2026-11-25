import { AuthRoles } from '../../types/enums';

/** Keys under `assistant.suggestions.questions` and `assistant.suggestions.tasks`. */
export interface Suggestions {
  questions: string[];
  tasks: string[];
}

const COURSE_MANAGERS: string[] = [AuthRoles.admin, AuthRoles.instructor, AuthRoles.org_admin];

/**
 * What the empty Assistant offers to start with: questions for everyone, and on a
 * course's management page tasks that the Assistant can draft as Proposed Changes.
 */
export const suggestionsFor = (route: string, role: string): Suggestions => {
  if (route === '/manage/course/[courseId]' && COURSE_MANAGERS.includes(role)) {
    return {
      questions: ['what_can_you_change'],
      tasks: ['shorten_tagline', 'improve_goals', 'move_sessions'],
    };
  }
  if (route.startsWith('/course/[courseId]')) {
    return { questions: ['course_apply', 'course_certificate'], tasks: [] };
  }
  return { questions: ['how_to_apply', 'my_certificates'], tasks: [] };
};
