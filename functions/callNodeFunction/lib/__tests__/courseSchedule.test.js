import { formatCourseDateTime, describeCourseLocations } from '../courseSchedule.js';
import { createEnrollmentVariableReplacer } from '../../emailTemplateVariables.js';

// Times in UTC; Berlin is UTC+1 in winter.
const session = (start, end, SessionAddresses = []) => ({ startDateTime: start, endDateTime: end, SessionAddresses });

const zbw = {
  address: null,
  CourseLocation: { locationOption: 'KIEL' },
  LocationAddress: { shortLabel: 'ZBW', address: 'Düsternbrooker Weg 120, 24105 Kiel' },
};
const heide = {
  address: 'Fritz-Thiedemann-Ring 20, 25746 Heide',
  CourseLocation: { locationOption: 'HEIDE' },
  LocationAddress: null,
};
const online = {
  address: 'https://zoom.us/j/123',
  CourseLocation: { locationOption: 'ONLINE' },
  LocationAddress: null,
};

describe('formatCourseDateTime', () => {
  it('shows date and time range for one Session', () => {
    const course = { Sessions: [session('2026-11-26T17:00:00Z', '2026-11-26T19:00:00Z')] };
    expect(formatCourseDateTime(course)).toBe('26.11.2026, 18:00–20:00');
  });

  it('shows both timestamps for one Session that ends on another day', () => {
    const course = { Sessions: [session('2026-12-05T17:00:00Z', '2026-12-06T09:00:00Z')] };
    expect(formatCourseDateTime(course)).toBe('05.12.2026, 18:00 – 06.12.2026, 10:00');
  });

  it('shows first to last date for several Sessions, whatever their order', () => {
    const course = {
      Sessions: [
        session('2027-03-25T16:00:00Z', '2027-03-25T18:00:00Z'),
        session('2027-01-14T16:00:00Z', '2027-01-14T18:00:00Z'),
      ],
    };
    expect(formatCourseDateTime(course)).toBe('14.01.2027 – 25.03.2027');
  });

  it('shows one day with first start and last end when all Sessions fall on it', () => {
    const course = {
      Sessions: [
        session('2026-12-05T09:00:00Z', '2026-12-05T11:00:00Z'),
        session('2026-12-05T13:00:00Z', '2026-12-05T15:00:00Z'),
      ],
    };
    expect(formatCourseDateTime(course)).toBe('05.12.2026, 10:00–16:00');
  });

  it('falls back to the course start date without Sessions', () => {
    expect(formatCourseDateTime({ Sessions: [], startTime: '2027-07-03T08:00:00Z' })).toBe('03.07.2027');
    expect(formatCourseDateTime({ startTime: '2027-07-03T08:00:00Z' })).toBe('03.07.2027');
  });

  it('is empty without Sessions and start date', () => {
    expect(formatCourseDateTime({ Sessions: [], startTime: null })).toBe('');
  });
});

describe('describeCourseLocations', () => {
  it('lists every distinct place once and never the meeting link', () => {
    const course = {
      Sessions: [
        session('2027-01-14T16:00:00Z', null, [zbw, online]),
        session('2027-01-21T16:00:00Z', null, [zbw, heide]),
      ],
    };
    expect(describeCourseLocations(course)).toEqual({
      places: ['Kiel – ZBW (Düsternbrooker Weg 120, 24105 Kiel)', 'Online', 'Heide – Fritz-Thiedemann-Ring 20, 25746 Heide'],
      online: true,
    });
  });

  it('is empty without Sessions', () => {
    expect(describeCourseLocations({ Sessions: [] })).toEqual({ places: [], online: false });
  });
});

describe('enrollment mails: [Course:DateTime], [Course:LocationList] and their blocks', () => {
  const template = [
    '[#if:CourseDateTime]Wann: [Course:DateTime]|[/if:CourseDateTime]',
    '[#if:CourseLocation]Wo: [Course:LocationList]|[/if:CourseLocation]',
    '[#if:Calendar]Kalender|[/if:Calendar]',
    '[#if:Online]Link folgt|[/if:Online]',
    '[#if:Other]kept[/if:Other]',
  ].join('');
  const details = (Sessions, startTime = null) => ({
    id: 1,
    status: 'CONFIRMED',
    User: { firstName: 'Alex', lastName: 'Beispiel', status: 'ACTIVE' },
    Course: { id: 7, title: 'KI-Stammtisch', startTime, Sessions },
  });
  const formatDate = (d) => d;

  it('fills a one-Session event on site with calendar attached', () => {
    const replace = createEnrollmentVariableReplacer(
      details([session('2026-11-26T17:00:00Z', '2026-11-26T19:00:00Z', [zbw])]),
      formatDate,
      { calendarAttached: true }
    );
    expect(replace(template)).toBe(
      'Wann: 26.11.2026, 18:00–20:00|' +
        'Wo: <ul><li>Kiel – ZBW (Düsternbrooker Weg 120, 24105 Kiel)</li></ul>|' +
        'Kalender|' +
        '[#if:Other]kept[/if:Other]'
    );
  });

  it('shows the online note only when a place is online', () => {
    const replace = createEnrollmentVariableReplacer(
      details([session('2026-12-03T16:00:00Z', '2026-12-03T17:30:00Z', [online])]),
      formatDate
    );
    expect(replace(template)).toBe(
      'Wann: 03.12.2026, 17:00–18:30|Wo: <ul><li>Online</li></ul>|Link folgt|[#if:Other]kept[/if:Other]'
    );
  });

  it('drops the location and calendar lines when there is nothing to show', () => {
    const replace = createEnrollmentVariableReplacer(details([], '2027-07-03T08:00:00Z'), formatDate);
    expect(replace(template)).toBe('Wann: 03.07.2027|[#if:Other]kept[/if:Other]');
  });

  it('escapes venue text in the HTML list', () => {
    const odd = { ...zbw, LocationAddress: { shortLabel: '<b>X</b>', address: 'A & B' } };
    const replace = createEnrollmentVariableReplacer(
      details([session('2026-11-26T17:00:00Z', '2026-11-26T19:00:00Z', [odd])]),
      formatDate
    );
    expect(replace('[Course:LocationList]')).toBe('<ul><li>Kiel – &lt;b&gt;X&lt;/b&gt; (A &amp; B)</li></ul>');
  });
});

describe('[User:Firstname] typo alias', () => {
  it('is filled like [User:FirstName]', () => {
    const replace = createEnrollmentVariableReplacer(
      { id: 1, status: 'CONFIRMED', User: { firstName: 'Alex', status: 'ACTIVE' }, Course: { id: 7, title: 'X' } },
      (d) => d
    );
    expect(replace('Hallo [User:Firstname] / [User:FirstName]')).toBe('Hallo Alex / Alex');
  });
});
