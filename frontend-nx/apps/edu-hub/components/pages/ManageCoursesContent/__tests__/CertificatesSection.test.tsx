import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import CertificatesSection from '../CertificatesSection';
import { AdminCourseList_Course } from '../../../../queries/__generated__/AdminCourseList';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('../../../../hooks/authedMutation', () => ({
  useManageMutation: () => [jest.fn()],
  useRoleMutation: () => [jest.fn()],
}));

// The fields behind the switches only need to show up by label here.
jest.mock('../../../inputs/InputField', () =>
  function MockField({ label }: { label: string }) {
    return <div>{label}</div>;
  }
);
jest.mock('../../../inputs/DatePicker', () =>
  function MockField({ label }: { label: string }) {
    return <div>{label}</div>;
  }
);
jest.mock('../../../inputs/TagSelector', () =>
  function MockField({ label }: { label: string }) {
    return <div>{label}</div>;
  }
);
jest.mock('../../../inputs/RadioSelector', () =>
  function MockRadioSelector() {
    return null;
  }
);

const makeCourse = (attendance: boolean, achievement: boolean) =>
  ({
    id: 1,
    attendanceCertificatePossible: attendance,
    achievementCertificatePossible: achievement,
    projectProposalsEnabled: null,
    projectSubmissionDeadline: null,
    maxMissedSessions: 2,
    ects: null,
    learningGoals: null,
    CourseDegrees: [],
    Program: null,
  } as unknown as AdminCourseList_Course);

const renderSection = (course: AdminCourseList_Course, isEventCourse: boolean) => {
  const onAttendance = jest.fn();
  const onAchievement = jest.fn();
  render(
    <CertificatesSection
      course={course}
      isEventCourse={isEventCourse}
      degreeCourses={[]}
      onSetAttendanceCertificatePossible={onAttendance}
      onSetAchievementCertificatePossible={onAchievement}
    />
  );
  return { onAttendance, onAchievement };
};

const mainSwitch = () => screen.getByRole('switch', { name: 'certificates.enable' });

describe('CertificatesSection', () => {
  it('shows only the main switch while no certificate is awarded', () => {
    renderSection(makeCourse(false, false), true);
    expect(mainSwitch()).not.toBeChecked();
    expect(screen.queryByText('max_missed_sessions.label')).not.toBeInTheDocument();
  });

  it('awards the attendance certificate right away for an event', () => {
    const { onAttendance, onAchievement } = renderSection(makeCourse(false, false), true);
    fireEvent.click(mainSwitch());
    expect(onAttendance).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), true);
    expect(onAchievement).not.toHaveBeenCalled();
    expect(screen.queryByRole('switch', { name: 'possible_certificates.achievement_certificate' })).toBeNull();
  });

  it('only opens the choice for a course, so achievement can be awarded without attendance', () => {
    const { onAttendance, onAchievement } = renderSection(makeCourse(false, false), false);
    fireEvent.click(mainSwitch());
    expect(onAttendance).not.toHaveBeenCalled();
    expect(screen.getByText('max_missed_sessions.label')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('switch', { name: 'possible_certificates.achievement_certificate' }));
    expect(onAchievement).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), true);
    expect(onAttendance).not.toHaveBeenCalled();
  });

  it('shows the learning goals only with an achievement certificate', () => {
    renderSection(makeCourse(true, false), false);
    expect(screen.queryByText('learning_goals.label')).not.toBeInTheDocument();
  });

  it('shows the learning goals for an achievement-only course', () => {
    renderSection(makeCourse(false, true), false);
    expect(mainSwitch()).toBeChecked();
    expect(screen.getByText('learning_goals.label')).toBeInTheDocument();
  });

  it('clears both certificates when the main switch is turned off', () => {
    const { onAttendance, onAchievement } = renderSection(makeCourse(true, true), false);
    fireEvent.click(mainSwitch());
    expect(onAttendance).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), false);
    expect(onAchievement).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), false);
  });
});
