/**
 * Session location resolution, free of React so both the course page and the
 * server-rendered events calendar feed (`pages/api/events/ical.ts`) answer
 * "where does this session take place" the same way.
 *
 * The types are structural on purpose: any query that selects these fields fits,
 * whatever its generated type is called.
 */

type ResolvableCourseLocation = {
  id: number;
  locationOption: string | null;
  defaultSessionAddress?: string | null;
  defaultSessionAddressId?: number | null;
};

export type ResolvableSession = {
  programId?: number | null;
  SessionAddresses: {
    id: number;
    address: string | null;
    locationAddressId?: number | null;
    locationOption?: string | null;
    CourseLocation?: ResolvableCourseLocation | null;
  }[];
};

/** One location of one session, with its address already resolved for display. */
export interface ResolvedLocation {
  /** Stable per location: `cl-<CourseLocation id>`, or `sa-<SessionAddress id>` for program sessions. */
  key: string;
  locationOption: string | null;
  displayAddress: string;
}

export type AddressMap = Map<number, { address: string }>;

/**
 * Which locations a session takes place at, in the order the course lists them,
 * with each address resolved through the LocationAddress ids and falling back to
 * the legacy free-text fields.
 */
export const resolveSessionLocations = (
  session: ResolvableSession,
  courseLocations: { id: number }[],
  addressMap: AddressMap
): ResolvedLocation[] =>
  session.programId != null
    ? resolveProgramSessionLocations(session, addressMap)
    : resolveCourseSessionLocations(session, courseLocations, addressMap);

/**
 * Program sessions have no CourseLocation: each SessionAddress carries its own
 * location option and either a LocationAddress or a free-text address (the
 * meeting link for online sessions).
 */
const resolveProgramSessionLocations = (session: ResolvableSession, addressMap: AddressMap): ResolvedLocation[] =>
  session.SessionAddresses.filter((sa) => sa.locationOption).map((sa) => ({
    key: `sa-${sa.id}`,
    locationOption: sa.locationOption ?? null,
    displayAddress:
      sa.locationAddressId && addressMap.has(sa.locationAddressId)
        ? addressMap.get(sa.locationAddressId)!.address
        : sa.address ?? '',
  }));

const resolveCourseSessionLocations = (
  session: ResolvableSession,
  courseLocations: { id: number }[],
  addressMap: AddressMap
): ResolvedLocation[] =>
  courseLocations.flatMap((courseLocation) => {
    const sessionAddress = session.SessionAddresses.find((sa) => sa.CourseLocation?.id === courseLocation.id);
    if (!sessionAddress) return [];

    const { address, CourseLocation } = sessionAddress;
    const effectiveAddressId = sessionAddress.locationAddressId || CourseLocation?.defaultSessionAddressId;

    const displayAddress =
      effectiveAddressId && addressMap.has(effectiveAddressId)
        ? addressMap.get(effectiveAddressId)!.address
        : address && address.trim() !== ''
        ? address
        : CourseLocation?.defaultSessionAddress || '';

    return [
      {
        key: `cl-${courseLocation.id}`,
        locationOption: CourseLocation?.locationOption ?? null,
        displayAddress,
      },
    ];
  });

/** Every LocationAddress id these sessions point at, directly or through their course location's default. */
export const referencedAddressIds = (sessions: ResolvableSession[]): number[] => {
  const ids = new Set<number>();
  (sessions ?? []).forEach((session) => {
    session.SessionAddresses.forEach((sessionAddress) => {
      if (sessionAddress.locationAddressId) ids.add(sessionAddress.locationAddressId);
      if (sessionAddress.CourseLocation?.defaultSessionAddressId) {
        ids.add(sessionAddress.CourseLocation.defaultSessionAddressId);
      }
    });
  });
  return Array.from(ids);
};
