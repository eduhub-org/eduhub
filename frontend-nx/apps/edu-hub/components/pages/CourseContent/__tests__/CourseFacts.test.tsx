import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CourseFacts } from '../CourseFacts';

jest.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key;
    t.raw = () => ({});
    return t;
  },
  useLocale: () => 'de',
}));

jest.mock('../../../../contexts/AppSettingsContext', () => ({
  useAppSettings: () => ({ timeZone: 'Europe/Berlin' }),
}));

jest.mock('../../../../helpers/dateTimeHelpers', () => ({
  useStartTimeString: () => () => '19:00',
  useEndTimeString: () => () => '21:00',
  getWeekdayString: () => 'DIENSTAG',
}));

/** Tomorrow, so registration counts as open unless a test says otherwise. */
const OPEN = new Date(Date.now() + 86_400_000);
const CLOSED = new Date(Date.now() - 86_400_000);

const course = (overrides: Record<string, unknown> = {}) =>
  ({
    Program: { type: 'COURSES' },
    weekDay: 'NONE',
    Sessions: [],
    CourseLocations: [],
    CourseInstructors: [],
    language: null,
    ects: null,
    achievementCertificatePossible: false,
    registrationType: null,
    basePrice: null,
    CourseAddonMappings: [],
    applicationEnd: OPEN,
    activeParticipantCount: 12,
    publicParticipantCount: 12,
    maxParticipants: 20,
    showAvailablePlaces: false,
    ...overrides,
  } as any);

const placesShown = () => screen.queryByText(/info\.places_left/);
const countShown = () => screen.queryByText(/info\.participant_count/);

describe('CourseFacts participant numbers', () => {
  it('shows how many are taking part by default', () => {
    render(<CourseFacts course={course()} />);

    expect(countShown()).toHaveTextContent('info.participant_count:{"count":12}');
    expect(placesShown()).not.toBeInTheDocument();
  });

  it('shows the free places instead once the course opts in', () => {
    render(<CourseFacts course={course({ showAvailablePlaces: true })} />);

    expect(placesShown()).toHaveTextContent('info.places_left:{"count":8}');
    expect(screen.getByText(/info\.places_total/)).toHaveTextContent('{"count":20}');
    expect(countShown()).not.toBeInTheDocument();
  });

  it.each([
    ['null', null],
    ['zero', 0],
  ])('never shows places when maxParticipants is %s, even when opted in', (_label, maxParticipants) => {
    render(<CourseFacts course={course({ showAvailablePlaces: true, maxParticipants })} />);

    expect(placesShown()).not.toBeInTheDocument();
    // it falls back to the count, which needs no cap
    expect(countShown()).toHaveTextContent('info.participant_count:{"count":12}');
  });

  it('stops offering places once registration has closed', () => {
    render(<CourseFacts course={course({ showAvailablePlaces: true, applicationEnd: CLOSED })} />);

    expect(placesShown()).not.toBeInTheDocument();
  });

  it('stops offering places when the course is full', () => {
    render(
      <CourseFacts
        course={course({ showAvailablePlaces: true, activeParticipantCount: 20, publicParticipantCount: 20 })}
      />
    );

    expect(placesShown()).not.toBeInTheDocument();
  });

  it('states the public count but measures places against held seats', () => {
    // 18 taken, 2 more invited but not yet accepted: 18 people are taking part,
    // and there are no places left to offer.
    render(
      <CourseFacts
        course={course({ showAvailablePlaces: true, activeParticipantCount: 20, publicParticipantCount: 18 })}
      />
    );

    expect(placesShown()).not.toBeInTheDocument();
    expect(countShown()).toHaveTextContent('info.participant_count:{"count":18}');
  });

  it('does not count invited people as participants', () => {
    render(<CourseFacts course={course({ activeParticipantCount: 12, publicParticipantCount: 9 })} />);

    expect(countShown()).toHaveTextContent('info.participant_count:{"count":9}');
  });

  it('says nothing at all about numbers when nobody has joined yet', () => {
    render(<CourseFacts course={course({ activeParticipantCount: 0, publicParticipantCount: 0 })} />);

    expect(countShown()).not.toBeInTheDocument();
    expect(placesShown()).not.toBeInTheDocument();
  });
});
