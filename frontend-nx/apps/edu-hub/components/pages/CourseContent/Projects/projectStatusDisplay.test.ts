import { ProjectStatus_enum } from '../../../../__generated__/globalTypes';
import { isPassedProject, isProjectTypeEditable } from './projectStatusDisplay';

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

describe('isPassedProject', () => {
  // Table-driven over the whole enum so a new status forces an explicit decision.
  const expected: Record<ProjectStatus_enum, boolean> = {
    [ProjectStatus_enum.PROPOSED]: false,
    [ProjectStatus_enum.ONGOING]: false,
    [ProjectStatus_enum.SUBMITTED]: false,
    [ProjectStatus_enum.COMPLETED]: true,
    // Rated as not passed: may be deleted.
    [ProjectStatus_enum.INCOMPLETE]: false,
    [ProjectStatus_enum.PUBLISHED]: true,
  };

  it.each(Object.entries(expected))('%s -> %s', (status, passed) => {
    expect(
      isPassedProject({ status: status as ProjectStatus_enum, published: false })
    ).toBe(passed);
  });

  it('treats a project shown in the showcase as passed whatever its status', () => {
    expect(
      isPassedProject({ status: ProjectStatus_enum.INCOMPLETE, published: true })
    ).toBe(true);
  });
});
