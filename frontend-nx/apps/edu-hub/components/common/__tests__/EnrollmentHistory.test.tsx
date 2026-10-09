import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  EnrollmentHistory,
  attendanceOf,
  groupEnrollmentsByProgram,
  isAttendanceUnrecorded,
} from '../EnrollmentHistory';
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

const stats = (attendedSessions: number, totalSessions: number, pastSessions = totalSessions) => ({
  __typename: 'CourseEnrollmentAttendanceStats' as const,
  attendedSessions,
  totalSessions,
  pastSessions,
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

  it('reports attendance for direct sign-ups such as events', () => {
    expect(
      attendanceOf(enrollment('x', P26S, CourseEnrollmentStatus_enum.REGISTERED, { AttendanceStats: stats(1, 1) }))
    ).toEqual({ attended: 1, total: 1, percent: 100 });
  });
});

describe('isAttendanceUnrecorded', () => {
  it('is true only when sessions are over but nothing was recorded for a participation', () => {
    const registered = (AttendanceStats: ReturnType<typeof stats> | null) =>
      enrollment('x', P26S, CourseEnrollmentStatus_enum.REGISTERED, { AttendanceStats });
    expect(isAttendanceUnrecorded(registered(stats(0, 0, 2)))).toBe(true);
    // Still upcoming
    expect(isAttendanceUnrecorded(registered(null))).toBe(false);
    // Recorded
    expect(isAttendanceUnrecorded(registered(stats(1, 2, 2)))).toBe(false);
    // Not a participation
    expect(
      isAttendanceUnrecorded(
        enrollment('x', P26S, CourseEnrollmentStatus_enum.APPLIED, { AttendanceStats: stats(0, 0, 2) })
      )
    ).toBe(false);
  });
});

describe('EnrollmentHistory', () => {
  it('renders a timeline entry per enrollment with status, earned ECTS and attendance', () => {
    render(
      <EnrollmentHistory
        enrollments={[
          enrollment('Applied ML', P26S, CourseEnrollmentStatus_enum.COMPLETED, {
            achievementCertificateURL: 'cert.pdf',
            AttendanceStats: stats(9, 10),
          }),
          enrollment('Pentesting', P26W, CourseEnrollmentStatus_enum.CANCELLED),
          enrollment('Open Day', P26W, CourseEnrollmentStatus_enum.REGISTERED, { AttendanceStats: stats(0, 0, 1) }),
        ]}
      />
    );

    const entry = (title: string) => screen.getByText(title).closest('li') as HTMLElement;

    const completed = entry('Applied ML');
    expect(within(completed).getByText('26S')).toBeInTheDocument();
    expect(within(completed).getByText(/status\.COMPLETED/)).toBeInTheDocument();
    expect(within(completed).getByText(/ects \{"ects":"5"\}/)).toBeInTheDocument();
    expect(within(completed).getByText(/attendance \{"attended":9,"total":10,"percent":90\}/)).toBeInTheDocument();

    const cancelled = entry('Pentesting');
    expect(within(cancelled).getByText(/status\.CANCELLED/)).toBeInTheDocument();
    expect(within(cancelled).queryByText(/attendance/)).not.toBeInTheDocument();
    expect(within(cancelled).queryByText(/ects/)).not.toBeInTheDocument();

    const event = entry('Open Day');
    expect(within(event).getByText(/attendance_not_recorded$/)).toBeInTheDocument();
    const dot = within(event).getByTestId('history-dot');
    expect(dot.style.backgroundColor).toBe('');
    expect(dot.style.borderStyle).toBe('solid');
    expect(dot.style.borderWidth).toBe('2px');
  });

  it('shows the empty state when only the current course is there', () => {
    const current = enrollment('Current', P26W, CourseEnrollmentStatus_enum.APPLIED);
    render(<EnrollmentHistory enrollments={[current]} excludeCourseId={current.courseId} />);
    expect(screen.getByText('empty')).toBeInTheDocument();
  });
});
