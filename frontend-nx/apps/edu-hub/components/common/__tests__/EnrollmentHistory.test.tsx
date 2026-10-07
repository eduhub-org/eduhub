import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import { EnrollmentHistory, attendanceOf, groupEnrollmentsByProgram } from '../EnrollmentHistory';
import { EnrollmentHistoryFragment } from '../../../queries/__generated__/EnrollmentHistoryFragment';
import { CourseEnrollmentStatus_enum } from '../../../__generated__/globalTypes';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

const program = (id: number, shortTitle: string, lectureStart: string | null) => ({
  __typename: 'Program' as const,
  id,
  title: `Program ${shortTitle}`,
  shortTitle,
  lectureStart,
});

const P26S = program(1, '26S', '2026-04-15');
const P26W = program(2, '26W', '2026-10-15');
const DEGREES = program(3, 'DEGREES', null);

let nextId = 1;
const enrollment = (
  title: string,
  prog: ReturnType<typeof program>,
  status: CourseEnrollmentStatus_enum,
  extra: Partial<EnrollmentHistoryFragment> = {}
): EnrollmentHistoryFragment => {
  const id = nextId++;
  return {
    __typename: 'CourseEnrollment',
    id,
    status,
    courseId: 100 + id,
    created_at: `2026-0${id}-01T00:00:00Z`,
    achievementCertificateURL: null,
    Course: { __typename: 'Course', id: 100 + id, title, ects: '5', Program: prog },
    AttendanceStats: null,
    ...extra,
  };
};

const stats = (attendedSessions: number, totalSessions: number) => ({
  __typename: 'CourseEnrollmentAttendanceStats' as const,
  attendedSessions,
  totalSessions,
});

describe('groupEnrollmentsByProgram', () => {
  it('groups by program, newest program first and programs without lecture start last', () => {
    const a = enrollment('Applied ML', P26S, CourseEnrollmentStatus_enum.CONFIRMED);
    const b = enrollment('Degree', DEGREES, CourseEnrollmentStatus_enum.CONFIRMED);
    const c = enrollment('Env Sensing', P26W, CourseEnrollmentStatus_enum.APPLIED);
    const d = enrollment('Pentesting', P26W, CourseEnrollmentStatus_enum.CANCELLED);

    const groups = groupEnrollmentsByProgram([a, b, c, d]);

    expect(groups.map((g) => g.shortTitle)).toEqual(['26W', '26S', 'DEGREES']);
    // Newest enrollment first within the program
    expect(groups[0].enrollments.map((e) => e.Course.title)).toEqual(['Pentesting', 'Env Sensing']);
  });

  it('leaves out the excluded course', () => {
    const a = enrollment('Current', P26W, CourseEnrollmentStatus_enum.APPLIED);
    expect(groupEnrollmentsByProgram([a], a.courseId)).toEqual([]);
  });
});

describe('attendanceOf', () => {
  it('only reports attendance for participations with counted sessions', () => {
    expect(
      attendanceOf(enrollment('x', P26S, CourseEnrollmentStatus_enum.CONFIRMED, { AttendanceStats: stats(13, 15) }))
    ).toEqual({ attended: 13, total: 15, percent: 87 });
    expect(
      attendanceOf(enrollment('x', P26S, CourseEnrollmentStatus_enum.APPLIED, { AttendanceStats: stats(1, 2) }))
    ).toBeNull();
    expect(
      attendanceOf(enrollment('x', P26S, CourseEnrollmentStatus_enum.COMPLETED, { AttendanceStats: stats(0, 0) }))
    ).toBeNull();
  });
});

describe('EnrollmentHistory', () => {
  it('renders program groups with status badges, earned ECTS and attendance', () => {
    render(
      <EnrollmentHistory
        enrollments={[
          enrollment('Applied ML', P26S, CourseEnrollmentStatus_enum.COMPLETED, {
            achievementCertificateURL: 'cert.pdf',
            AttendanceStats: stats(9, 10),
          }),
          enrollment('Pentesting', P26W, CourseEnrollmentStatus_enum.CANCELLED),
        ]}
      />
    );

    const group26S = screen.getByRole('region', { name: 'Program 26S' });
    expect(within(group26S).getByText('status.COMPLETED')).toBeInTheDocument();
    expect(within(group26S).getByText('ects {"ects":"5"}')).toBeInTheDocument();
    expect(within(group26S).getByText('attendance {"attended":9,"total":10,"percent":90}')).toBeInTheDocument();

    const group26W = screen.getByRole('region', { name: 'Program 26W' });
    expect(within(group26W).getByText('status.CANCELLED')).toBeInTheDocument();
    expect(within(group26W).queryByText(/^attendance/)).not.toBeInTheDocument();
    expect(within(group26W).queryByText(/^ects/)).not.toBeInTheDocument();
  });

  it('shows the empty state when only the current course is there', () => {
    const current = enrollment('Current', P26W, CourseEnrollmentStatus_enum.APPLIED);
    render(<EnrollmentHistory enrollments={[current]} excludeCourseId={current.courseId} />);
    expect(screen.getByText('empty')).toBeInTheDocument();
  });
});
