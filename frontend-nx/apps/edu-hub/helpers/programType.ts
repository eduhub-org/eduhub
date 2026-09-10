import { ProgramType } from '../types/enums';

/**
 * Suffix of the program-type-aware translation keys in the `manageCourses` namespace, e.g.
 * `notifications.added_success.events` or `empty_state.degrees`.
 *
 * The manage courses/events/degrees pages all render `ManageCoursesContent` with a different
 * `programType`, so every user-facing message needs one wording variant per program type.
 */
export const programTypeMessageKey = (programType: ProgramType): 'courses' | 'events' | 'degrees' => {
  switch (programType) {
    case ProgramType.EVENTS:
      return 'events';
    case ProgramType.DEGREES:
      return 'degrees';
    default:
      return 'courses';
  }
};
