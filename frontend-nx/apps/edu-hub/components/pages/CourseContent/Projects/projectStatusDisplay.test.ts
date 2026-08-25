import { ProjectStatus_enum } from '../../../../__generated__/globalTypes';
import {
  isProjectReviewCommentFromPreviousRound,
  isProjectTypeEditable,
} from './projectStatusDisplay';

describe('isProjectTypeEditable', () => {
  // Table-driven over the whole enum so a new status forces an explicit decision.
  const expected: Record<ProjectStatus_enum, boolean> = {
    [ProjectStatus_enum.PROPOSED]: true,
    // Instructors may still correct the type after confirming the team, and
    // again after a send-back (SUBMITTED -> ONGOING).
    [ProjectStatus_enum.ONGOING]: true,
    [ProjectStatus_enum.SUBMITTED]: false,
    [ProjectStatus_enum.COMPLETED]: false,
    [ProjectStatus_enum.INCOMPLETE]: false,
    [ProjectStatus_enum.PUBLISHED]: false,
  };

  it.each(Object.entries(expected))('%s -> %s', (status, editable) => {
    expect(isProjectTypeEditable(status as ProjectStatus_enum)).toBe(editable);
  });
});

describe('isProjectReviewCommentFromPreviousRound', () => {
  // A stored comment only predates the round in flight while the project sits
  // in review; everywhere else it is the verdict the project currently carries.
  const expected: Record<ProjectStatus_enum, boolean> = {
    [ProjectStatus_enum.PROPOSED]: false,
    // After a send-back the comment IS the current state — it is the reason the
    // project is ongoing again.
    [ProjectStatus_enum.ONGOING]: false,
    [ProjectStatus_enum.SUBMITTED]: true,
    [ProjectStatus_enum.COMPLETED]: false,
    [ProjectStatus_enum.INCOMPLETE]: false,
    [ProjectStatus_enum.PUBLISHED]: false,
  };

  it.each(Object.entries(expected))('%s -> %s', (status, fromPreviousRound) => {
    expect(isProjectReviewCommentFromPreviousRound(status as ProjectStatus_enum)).toBe(
      fromPreviousRound
    );
  });
});
