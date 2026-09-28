import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Attendances } from '../Attendances';
import type { CourseWithEnrollment_Course_by_pk } from '../../../../queries/__generated__/CourseWithEnrollment';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
  useLocale: () => 'de',
}));

const session = (id: number, day: number, isMandatory: boolean, programId: number | null = null) => ({
  __typename: 'Session',
  id,
  programId,
  isMandatory,
  startDateTime: new Date(`2024-10-${String(day).padStart(2, '0')}T10:00:00Z`),
  Attendances: [],
});

const course = {
  maxMissedSessions: 1,
  Sessions: [session(1, 3, true), session(2, 10, false), session(3, 17, true)],
  Program: { Sessions: [session(9, 5, true, 4), session(10, 6, false, 4)] },
} as unknown as CourseWithEnrollment_Course_by_pk;

describe('Attendances', () => {
  it('lists only mandatory sessions, program-wide ones included', () => {
    render(<Attendances course={course} />);

    expect(screen.getByText('03.10.2024')).toBeInTheDocument();
    expect(screen.getByText('05.10.2024')).toBeInTheDocument();
    expect(screen.getByText('17.10.2024')).toBeInTheDocument();
    expect(screen.queryByText('10.10.2024')).not.toBeInTheDocument();
    expect(screen.queryByText('06.10.2024')).not.toBeInTheDocument();
    expect(screen.getByText(/attendances.max_missed_mandatory_sessions/)).toHaveTextContent('"total":3');
  });
});
