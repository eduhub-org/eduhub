import { describeSessionChange, referencedLocationAddressIds } from '../sessionChange.js';

const courseLocations = [
  { id: 1, locationOption: 'KIEL', defaultSessionAddress: 'Fallback street 1', defaultSessionAddressId: 10 },
  { id: 2, locationOption: 'ONLINE', defaultSessionAddress: 'https://zoom.example/j/1', defaultSessionAddressId: null },
];
const addressMap = new Map([
  [10, { id: 10, shortLabel: 'ZBW', address: 'Düsternbrooker Weg 120' }],
  [11, { id: 11, shortLabel: 'generic address', address: 'Raum 2.14' }],
]);
const start = '2026-11-18T17:00:00.000Z';
const end = '2026-11-18T18:30:00.000Z';
const hybrid = [
  { courseLocationId: 1, locationAddressId: null },
  { courseLocationId: 2, locationAddressId: null },
];
const sessionWith = (SessionAddresses, times = {}) => ({
  startDateTime: start,
  endDateTime: end,
  SessionAddresses,
  ...times,
});

describe('describeSessionChange', () => {
  it('announces only a new time when there is no previous state', () => {
    expect(describeSessionChange({ session: sessionWith([]), courseLocations, previous: null })).toEqual({
      templateType: 'SESSION_RESCHEDULED',
      flags: {},
    });
  });

  it('lists the places before and after a removed location, without the meeting link', () => {
    const change = describeSessionChange({
      session: sessionWith([{ courseLocationId: 2, locationAddressId: null, address: 'https://zoom.example/j/1' }]),
      courseLocations,
      previous: { startDateTime: start, endDateTime: end, locations: hybrid },
      addressMap,
    });

    expect(change).toEqual({
      templateType: 'SESSION_LOCATION_CHANGED',
      flags: { TimeChanged: false, TimeUnchanged: true },
      previousDateTimeRange: '18.11.2026, 18:00–19:30',
      locationList: ['Online'],
      previousLocationList: ['Kiel – ZBW (Düsternbrooker Weg 120)', 'Online'],
    });
  });

  it('flags a time that changed along with the locations', () => {
    const change = describeSessionChange({
      session: sessionWith([{ courseLocationId: 1, locationAddressId: 11 }], { endDateTime: '2026-11-18T19:00:00.000Z' }),
      courseLocations,
      previous: { startDateTime: start, endDateTime: end, locations: hybrid },
      addressMap,
    });

    expect(change.flags).toEqual({ TimeChanged: true, TimeUnchanged: false });
    // The migration placeholder label is not worth showing.
    expect(change.locationList).toEqual(['Kiel – Raum 2.14']);
  });

  it('announces a time-only change with the previous time', () => {
    const change = describeSessionChange({
      session: sessionWith(hybrid, { startDateTime: '2026-11-19T17:00:00.000Z', endDateTime: '2026-11-19T18:30:00.000Z' }),
      courseLocations,
      previous: { startDateTime: start, endDateTime: end, locations: hybrid },
      addressMap,
    });

    expect(change).toEqual({
      templateType: 'SESSION_RESCHEDULED',
      flags: { PreviousTime: true },
      previousDateTimeRange: '18.11.2026, 18:00–19:30',
    });
  });

  it('reports nothing when the session ended up as it was', () => {
    expect(
      describeSessionChange({
        session: sessionWith(hybrid),
        courseLocations,
        previous: { startDateTime: start, endDateTime: end, locations: hybrid },
        addressMap,
      })
    ).toBeNull();
  });

  it("ignores previous locations of another course", () => {
    expect(
      describeSessionChange({
        session: sessionWith(hybrid),
        courseLocations,
        previous: { startDateTime: start, endDateTime: end, locations: [...hybrid, { courseLocationId: 99, locationAddressId: 3 }] },
        addressMap,
      })
    ).toBeNull();
  });

  it('falls back to a plain reschedule mail for unparseable previous times', () => {
    expect(
      describeSessionChange({
        session: sessionWith(hybrid),
        courseLocations,
        previous: { startDateTime: 'yesterday', endDateTime: end, locations: [] },
      })
    ).toEqual({ templateType: 'SESSION_RESCHEDULED', flags: {} });
  });
});

describe('referencedLocationAddressIds', () => {
  it('collects the ids before and after plus the course defaults', () => {
    expect(
      referencedLocationAddressIds(
        sessionWith([{ courseLocationId: 1, locationAddressId: 11 }]),
        courseLocations,
        { locations: [{ courseLocationId: 1, locationAddressId: 12 }] }
      ).sort()
    ).toEqual([10, 11, 12]);
  });
});
