import { LocationOption_enum } from '../../../../../__generated__/globalTypes';
import { sessionLocationEntries } from '../SessionLocations';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

const courseLocations = [
  { __typename: 'CourseLocation', id: 5, locationOption: LocationOption_enum.ONLINE, defaultSessionAddress: 'https://zoom.us' },
  { __typename: 'CourseLocation', id: 4, locationOption: LocationOption_enum.KIEL, defaultSessionAddress: null },
] as never[];

const address = (id: number, courseLocationId: number, option: LocationOption_enum) => ({
  __typename: 'SessionAddress',
  id,
  address: '',
  locationAddressId: null,
  locationOption: null,
  CourseLocation: { __typename: 'CourseLocation', id: courseLocationId, locationOption: option, defaultSessionAddress: null, defaultSessionAddressId: null },
});

describe('sessionLocationEntries', () => {
  it('lists every course location and flags the ones the session has no address for', () => {
    const session = { id: 1, programId: null, SessionAddresses: [address(10, 4, LocationOption_enum.KIEL)] } as never;
    const entries = sessionLocationEntries(session, courseLocations);

    expect(entries.map((entry) => entry.option)).toEqual(
      [LocationOption_enum.ONLINE, LocationOption_enum.KIEL].sort(
        (a, b) => Object.values(LocationOption_enum).indexOf(a) - Object.values(LocationOption_enum).indexOf(b)
      )
    );
    const kiel = entries.find((entry) => entry.option === LocationOption_enum.KIEL);
    const online = entries.find((entry) => entry.option === LocationOption_enum.ONLINE);
    expect(kiel?.address?.id).toBe(10);
    expect(online?.address).toBeNull();
    expect(online?.courseLocationId).toBe(5);
  });

  it('uses a program session’s own addresses instead of the course locations', () => {
    const session = {
      id: 2,
      programId: 7,
      SessionAddresses: [{ ...address(11, 0, LocationOption_enum.ONLINE), CourseLocation: null, locationOption: LocationOption_enum.ONLINE }],
    } as never;
    const entries = sessionLocationEntries(session, courseLocations);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ option: LocationOption_enum.ONLINE, courseLocationId: null });
    expect(entries[0].address?.id).toBe(11);
  });
});
