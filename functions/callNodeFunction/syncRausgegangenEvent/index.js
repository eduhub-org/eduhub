import { GraphQLClient } from 'graphql-request';
import { decryptOrganizationCredential } from '../lib/organizationCredential.js';
import { ORG_ADMIN_ROLES, isOrgAdminOfCourse } from '../lib/orgAdminScope.js';
import { createRausgegangenClient, isProduction, mappingId, RausgegangenApiError } from '../lib/rausgegangen.js';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  buildEventPayload,
  buildLocationPayload,
  buildShowPayload,
  findMatchingLocation,
  isSoldOut,
  missingLocationFields,
  pickShowSession,
} from '../lib/rausgegangenMapping.js';

/**
 * Shares an event (a Course in an EVENTS program) on rausgegangen.de.
 *
 * Entry points, all ending in syncCourse(courseId):
 * - event triggers on RausgegangenListing, Course, Session, SessionAddress,
 *   LocationAddress and OrganizationFeature (deactivating the feature),
 * - the nightly cron `reconcile_rausgegangen_events`,
 * - the action `syncRausgegangenEventNow` ("Jetzt synchronisieren").
 *
 * The event is listed only while its listing is enabled, the organization has
 * the RAUSGEGANGEN feature (activated by a super admin) and the program is
 * published. Otherwise an already shared event is unpublished there. It is
 * sent as published only in production with the organization's test mode off.
 */

const FEATURE = 'RAUSGEGANGEN';

const LOCATION_FIELDS = `
  id
  shortLabel
  address
  description
  street
  zipCode
  city
  country
  addressAdditionalInfo
  directions
  latitude
  longitude
  category
  image
  imageCredits
  websiteUrl
  publicEmail
  publicPhone
  instagramUrl
  rausgegangenLocationId
  rausgegangenLocationOwned
`;

const GET_COURSE = `
  query RausgegangenCourse($courseId: Int!, $activeStatuses: [CourseEnrollmentStatus_enum!]!) {
    Course_by_pk(id: $courseId) {
      id
      title
      tagline
      headingDescriptionField1
      contentDescriptionField1
      headingDescriptionField2
      contentDescriptionField2
      coverImage
      coverImageCredits
      basePrice
      cost
      published
      maxParticipants
      externalRegistrationLink
      RausgegangenListing {
        id
        enabled
        category
        tags
        rausgegangenEventId
        published
      }
      Program {
        type
        published
        Organization {
          id
          name
          rausgegangenApiKeyEncrypted
          rausgegangenTestMode
          Features(where: { feature: { _eq: RAUSGEGANGEN } }) {
            id
          }
        }
      }
      CourseLocations(order_by: { id: asc }) {
        id
        locationOption
        defaultSessionAddress
        DefaultSessionAddress { ${LOCATION_FIELDS} }
      }
      Sessions(order_by: { startDateTime: asc }) {
        id
        title
        startDateTime
        endDateTime
        SessionAddresses {
          id
          address
          locationAddressId
          LocationAddress { ${LOCATION_FIELDS} }
          CourseLocation {
            id
          }
        }
      }
      CourseEnrollments_aggregate(where: { status: { _in: $activeStatuses }, isTest: { _eq: false } }) {
        aggregate {
          count
        }
      }
    }
  }
`;

const UPDATE_LISTING = `
  mutation UpdateRausgegangenListingSync($id: Int!, $set: RausgegangenListing_set_input!) {
    update_RausgegangenListing_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
    }
  }
`;

const UPDATE_LOCATION_LINK = `
  mutation UpdateLocationAddressRausgegangenLink($id: Int!, $locationId: String!, $owned: Boolean!) {
    update_LocationAddress_by_pk(
      pk_columns: { id: $id }
      _set: { rausgegangenLocationId: $locationId, rausgegangenLocationOwned: $owned }
    ) {
      id
    }
  }
`;

const GET_SESSION_COURSE = `
  query RausgegangenSessionCourse($sessionId: Int!) {
    Session_by_pk(id: $sessionId) {
      courseId
    }
  }
`;

const LISTINGS_AT_LOCATION = `
  query RausgegangenListingsAtLocation($locationAddressId: Int!) {
    RausgegangenListing(
      where: {
        Course: {
          _or: [
            { Sessions: { SessionAddresses: { locationAddressId: { _eq: $locationAddressId } } } }
            { CourseLocations: { defaultSessionAddressId: { _eq: $locationAddressId } } }
          ]
        }
      }
    ) {
      courseId
    }
  }
`;

const LISTINGS_OF_ORGANIZATION = `
  query RausgegangenListingsOfOrganization($organizationId: Int!) {
    RausgegangenListing(where: { Course: { Program: { organizationId: { _eq: $organizationId } } } }) {
      courseId
    }
  }
`;

// Enabled listings, plus disabled ones that may still be published there.
const LISTINGS_TO_RECONCILE = `
  query RausgegangenListingsToReconcile {
    RausgegangenListing(where: { _or: [{ enabled: { _eq: true } }, { published: { _eq: true } }] }) {
      courseId
    }
  }
`;

const getGraphqlClient = () => {
  const endpoint = process.env.HASURA_ENDPOINT;
  const secret = process.env.HASURA_ADMIN_SECRET;
  if (!endpoint || !secret) throw new Error('Missing HASURA_ENDPOINT or HASURA_ADMIN_SECRET');
  return new GraphQLClient(endpoint, { headers: { 'x-hasura-admin-secret': secret } });
};

/** Records the outcome on the listing; returns the result for the caller. */
const recordResult = async (client, listingId, set) => {
  await client.request(UPDATE_LISTING, {
    id: listingId,
    set: { ...set, lastSyncedAt: new Date().toISOString() },
  });
  return set;
};

/**
 * Unpublishes an event that was shared before. Only an event that was actually
 * created there (rausgegangenEventId) needs it.
 */
const unpublishIfShared = async ({ rausgegangen, course, listing, logger }) => {
  if (!listing.rausgegangenEventId || !rausgegangen) return;
  await rausgegangen.patchEvent({ mapping_id: mappingId('event', course.id), published: false });
  logger.info(`Unpublished Rausgegangen event of course ${course.id}`);
};

/**
 * The Rausgegangen location of the show's venue: the linked one, else an exact
 * search match (linked, not owned), else our own new location. Our own
 * locations are re-sent on every sync so address changes reach them.
 * @returns {Promise<{ locationId: string } | { error: string }>}
 */
const ensureLocation = async ({ client, rausgegangen, locationAddress, bucketUrl }) => {
  const ownMappingId = mappingId('location', locationAddress.id);

  if (locationAddress.rausgegangenLocationId && !locationAddress.rausgegangenLocationOwned) {
    return { locationId: locationAddress.rausgegangenLocationId };
  }

  const missing = missingLocationFields(locationAddress);

  if (locationAddress.rausgegangenLocationId && locationAddress.rausgegangenLocationOwned) {
    if (missing.length > 0) return { locationId: locationAddress.rausgegangenLocationId };
    const saved = await rausgegangen.putLocation(
      buildLocationPayload({ locationAddress, mappingId: ownMappingId, bucketUrl })
    );
    if (saved?.id && saved.id !== locationAddress.rausgegangenLocationId) {
      await client.request(UPDATE_LOCATION_LINK, { id: locationAddress.id, locationId: saved.id, owned: true });
    }
    return { locationId: saved?.id || locationAddress.rausgegangenLocationId };
  }

  if (missing.length > 0) {
    return {
      error: `Adresse „${locationAddress.shortLabel}" unvollständig (${missing.join(', ')}). Bitte in den Einstellungen unter Adressen ergänzen.`,
    };
  }

  const results = await rausgegangen.searchLocations({
    city: locationAddress.city,
    street: locationAddress.street,
  });
  const match = findMatchingLocation(results, locationAddress);
  if (match?.id) {
    await client.request(UPDATE_LOCATION_LINK, { id: locationAddress.id, locationId: match.id, owned: false });
    return { locationId: match.id };
  }

  const created = await rausgegangen.putLocation(
    buildLocationPayload({ locationAddress, mappingId: ownMappingId, bucketUrl })
  );
  if (!created?.id) throw new Error('Rausgegangen did not return an id for the new location');
  await client.request(UPDATE_LOCATION_LINK, { id: locationAddress.id, locationId: created.id, owned: true });
  return { locationId: created.id };
};

/**
 * Brings one event on rausgegangen.de in line with EduHub.
 * @returns {Promise<Object|null>} what was written to the listing; null without a listing
 */
export const syncCourse = async ({ client, courseId, logger, createClient = createRausgegangenClient }) => {
  const course = (
    await client.request(GET_COURSE, { courseId, activeStatuses: ACTIVE_ENROLLMENT_STATUSES })
  )?.Course_by_pk;
  const listing = course?.RausgegangenListing;
  if (!course || !listing) return null;

  const organization = course.Program?.Organization;
  const featureActive = (organization?.Features?.length ?? 0) > 0;
  const shouldBeListed = Boolean(listing.enabled && featureActive && course.Program?.published);

  let rausgegangen = null;
  if (organization?.rausgegangenApiKeyEncrypted) {
    let apiKey;
    try {
      apiKey = decryptOrganizationCredential(organization.rausgegangenApiKeyEncrypted, 'Rausgegangen API key');
    } catch (error) {
      // A rotated encryption key or a corrupted value; retrying cannot help, a new key can.
      logger.error(`Could not decrypt the Rausgegangen API key of organization ${organization.id}`, {
        error: error.message,
      });
      return recordResult(client, listing.id, {
        syncStatus: 'ERROR',
        syncError: 'Der Rausgegangen-API-Schlüssel konnte nicht entschlüsselt werden. Bitte hinterlege ihn neu.',
      });
    }
    rausgegangen = createClient({ apiKey, logger });
  }

  if (!shouldBeListed) {
    await unpublishIfShared({ rausgegangen, course, listing, logger });
    const reason = !featureActive
      ? 'Die Rausgegangen-Funktion ist für diese Organisation nicht freigeschaltet.'
      : !listing.enabled
        ? null
        : 'Das Programm ist nicht veröffentlicht.';
    return recordResult(client, listing.id, { syncStatus: 'SKIPPED', syncError: reason, published: false });
  }

  if (!rausgegangen) {
    return recordResult(client, listing.id, {
      syncStatus: 'SKIPPED',
      syncError: 'Für diese Organisation ist kein Rausgegangen-API-Schlüssel hinterlegt.',
      published: false,
    });
  }

  const showSession = pickShowSession(course.Sessions, course.CourseLocations);
  if (showSession.error) {
    await unpublishIfShared({ rausgegangen, course, listing, logger });
    return recordResult(client, listing.id, { syncStatus: 'SKIPPED', syncError: showSession.error, published: false });
  }

  const bucketUrl = process.env.STORAGE_BUCKET_PUBLIC_URL;
  const frontendUrl = process.env.FRONTEND_URL;

  const location = await ensureLocation({
    client,
    rausgegangen,
    locationAddress: showSession.locationAddress,
    bucketUrl,
  });
  if (location.error) {
    await unpublishIfShared({ rausgegangen, course, listing, logger });
    return recordResult(client, listing.id, { syncStatus: 'SKIPPED', syncError: location.error, published: false });
  }

  const published = isProduction() && !organization.rausgegangenTestMode;
  const event = await rausgegangen.putEvent(
    buildEventPayload({
      course,
      listing,
      mappingId: mappingId('event', course.id),
      published,
      bucketUrl,
      frontendUrl,
    })
  );
  if (!event?.id) throw new Error('Rausgegangen did not return an id for the event');

  const show = await rausgegangen.putShow(
    buildShowPayload({
      course,
      session: showSession.session,
      mappingId: mappingId('event', `${course.id}-show`),
      eventId: event.id,
      locationId: location.locationId,
      soldOut: isSoldOut(course, course.CourseEnrollments_aggregate?.aggregate?.count ?? 0),
      frontendUrl,
      sessionCount: course.Sessions.length,
    })
  );

  logger.info(`Synced course ${course.id} to Rausgegangen event ${event.id}`);
  return recordResult(client, listing.id, {
    syncStatus: 'SYNCED',
    syncError: null,
    published,
    rausgegangenEventId: event.id,
    rausgegangenShowId: show?.id ?? null,
    previewUrl: show?.preview_url ?? null,
    publicUrl: show?.public_url ?? null,
  });
};

/** syncCourse, with failures recorded on the listing instead of thrown. */
const syncCourseSafely = async ({ client, courseId, logger }) => {
  try {
    return { courseId, result: await syncCourse({ client, courseId, logger }) };
  } catch (error) {
    // graphql-request puts the whole request into error.message; the first GraphQL error is what matters.
    const message = error?.response?.errors?.[0]?.message ?? error.message;
    logger.error(`Rausgegangen sync of course ${courseId} failed`, { error: message });
    const retryable = error instanceof RausgegangenApiError ? error.retryable : !(error?.response?.errors?.length > 0);
    try {
      const listing = (
        await client.request(`query ($courseId: Int!) { RausgegangenListing(where: { courseId: { _eq: $courseId } }) { id } }`, {
          courseId,
        })
      )?.RausgegangenListing?.[0];
      if (listing) {
        await recordResult(client, listing.id, { syncStatus: 'ERROR', syncError: message.slice(0, 1000) });
      }
    } catch (recordError) {
      logger.error(`Could not record the Rausgegangen sync error of course ${courseId}`, { error: recordError.message });
    }
    return { courseId, error: message, retryable };
  }
};

/** The courses an event-trigger delivery concerns. */
const courseIdsOfEvent = async (client, body) => {
  const table = body.table?.name;
  const { old: oldRow, new: newRow } = body.event?.data ?? {};
  const row = newRow ?? oldRow ?? {};

  switch (table) {
    case 'RausgegangenListing':
      return [row.courseId];
    case 'Course':
      return [row.id];
    case 'Session':
      return row.courseId ? [row.courseId] : [];
    case 'SessionAddress': {
      const session = (await client.request(GET_SESSION_COURSE, { sessionId: row.sessionId }))?.Session_by_pk;
      return session?.courseId ? [session.courseId] : [];
    }
    case 'LocationAddress':
      return (await client.request(LISTINGS_AT_LOCATION, { locationAddressId: row.id })).RausgegangenListing.map(
        (listing) => listing.courseId
      );
    case 'OrganizationFeature':
      if (row.feature !== FEATURE) return [];
      return (await client.request(LISTINGS_OF_ORGANIZATION, { organizationId: row.organizationId })).RausgegangenListing.map(
        (listing) => listing.courseId
      );
    default:
      return [];
  }
};

const syncAll = async ({ client, courseIds, logger }) => {
  const results = [];
  // One at a time: the API has no documented rate limit, and an event's
  // location may be created by the previous one.
  for (const courseId of [...new Set(courseIds.filter(Boolean))]) {
    results.push(await syncCourseSafely({ client, courseId, logger }));
  }
  return results;
};

/** "Jetzt synchronisieren": super admins and the event's org admins. */
const handleAction = async ({ client, req, logger }) => {
  const courseId = Number(req.body.input?.courseId);
  const session = req.body.session_variables ?? {};
  const role = session['x-hasura-role'];
  const allowed =
    role === 'admin' ||
    (ORG_ADMIN_ROLES.has(role) && (await isOrgAdminOfCourse(client, session['x-hasura-user-id'], courseId)));
  if (!allowed) {
    return { success: false, error: 'Not allowed to manage this event' };
  }

  const { result, error } = await syncCourseSafely({ client, courseId, logger });
  if (error) return { success: false, syncStatus: 'ERROR', error };
  if (!result) return { success: false, error: 'Diese Veranstaltung ist nicht für Rausgegangen eingerichtet.' };
  return {
    success: result.syncStatus === 'SYNCED',
    syncStatus: result.syncStatus,
    error: result.syncError ?? null,
    previewUrl: result.previewUrl ?? null,
    publicUrl: result.publicUrl ?? null,
  };
};

export default async function syncRausgegangenEvent(req, logger) {
  const client = getGraphqlClient();
  const body = req.body ?? {};

  if (body.action) {
    return handleAction({ client, req, logger });
  }

  const courseIds = body.event
    ? await courseIdsOfEvent(client, body)
    : body.payload?.reconcile
      ? (await client.request(LISTINGS_TO_RECONCILE)).RausgegangenListing.map((listing) => listing.courseId)
      : [];

  const results = await syncAll({ client, courseIds, logger });
  const failed = results.filter((result) => result.error);
  return {
    success: failed.length === 0,
    synced: results.length - failed.length,
    failed: failed.length,
    // Only an event trigger is redelivered by Hasura; the side effects are
    // idempotent (everything is addressed by mapping_id).
    retryable: failed.some((result) => result.retryable),
  };
}
