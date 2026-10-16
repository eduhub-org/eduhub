import { jest } from '@jest/globals';
import { createRausgegangenClient, mappingId } from '../lib/rausgegangen.js';
import {
  buildEventDescription,
  buildEventPayload,
  buildLocationPayload,
  buildShowPayload,
  findMatchingLocation,
  formatPrice,
  isSoldOut,
  markdownToAllowedHtml,
  missingLocationFields,
  normalizeTags,
  pickShowSession,
  registrationUrlOf,
  toApiSlug,
} from '../lib/rausgegangenMapping.js';
import { syncCourse } from '../syncRausgegangenEvent/index.js';

const kiel = {
  id: 3,
  shortLabel: 'COBL',
  address: 'Legienstr. 40',
  description: 'Coworking im Zentrum',
  street: 'Legienstr. 40',
  zipCode: '24103',
  city: 'Kiel',
  country: 'Deutschland',
  latitude: 54.3233,
  longitude: 10.1228,
  category: 'WORKSPACE',
  image: null,
  imageCredits: null,
  rausgegangenLocationId: null,
  rausgegangenLocationOwned: false,
};

const courseLocations = [
  { id: 1, locationOption: 'KIEL', defaultSessionAddress: null, DefaultSessionAddress: kiel },
  { id: 2, locationOption: 'ONLINE', defaultSessionAddress: 'https://zoom.us/j/1', DefaultSessionAddress: null },
];

const session = (id, start, end, addresses) => ({
  id,
  title: `Session ${id}`,
  startDateTime: start,
  endDateTime: end,
  SessionAddresses: addresses,
});

const inKiel = (id) => ({ id, address: null, locationAddressId: null, LocationAddress: null, CourseLocation: { id: 1 } });
const online = (id) => ({ id, address: 'https://zoom.us/j/1', locationAddressId: null, LocationAddress: null, CourseLocation: { id: 2 } });

const baseCourse = (overrides = {}) => ({
  id: 12,
  title: 'KI im Alltag',
  tagline: 'Ein Abend über KI',
  headingDescriptionField1: 'Worum geht es?',
  contentDescriptionField1: 'Wir sprechen über **KI**.\n\n- Punkt eins\n- Punkt zwei\n\n![bild](x.png)',
  headingDescriptionField2: null,
  contentDescriptionField2: null,
  coverImage: 'courses/course-12/public/cover-image/cover.jpg',
  coverImageCredits: 'Foto: opencampus',
  basePrice: null,
  cost: null,
  published: true,
  maxParticipants: 20,
  externalRegistrationLink: null,
  Program: { type: 'EVENTS', published: true, Organization: { id: 1, name: 'opencampus.sh' } },
  CourseLocations: courseLocations,
  Sessions: [session(100, '2026-11-03T17:00:00+00:00', '2026-11-03T19:00:00+00:00', [inKiel(1)])],
  ...overrides,
});

describe('environment rules', () => {
  const previous = process.env.ENVIRONMENT;
  afterEach(() => {
    process.env.ENVIRONMENT = previous;
  });

  it('prefixes mapping ids outside production only', () => {
    process.env.ENVIRONMENT = 'production';
    expect(mappingId('event', 12)).toBe('eduhub-event-12');
    process.env.ENVIRONMENT = 'staging';
    expect(mappingId('event', '12-show')).toBe('eduhub-staging-event-12-show');
  });

  it('never publishes and never sends a stored id outside production', async () => {
    process.env.ENVIRONMENT = 'staging';
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{"id":"e1"}' });
    const client = createRausgegangenClient({ apiKey: 'k', fetchImpl });

    await client.putEvent({ id: 'live-id', mapping_id: 'eduhub-staging-event-12', published: true });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toContain('api_key=k');
    expect(JSON.parse(init.body)).toEqual({ mapping_id: 'eduhub-staging-event-12', published: false });
  });

  it('sends published as given in production', async () => {
    process.env.ENVIRONMENT = 'production';
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{}' });
    await createRausgegangenClient({ apiKey: 'k', fetchImpl }).putEvent({ mapping_id: 'm', published: true });
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).published).toBe(true);
  });

  it('retries server errors but not validation errors', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 502, text: async () => 'bad gateway' })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '{"id":"x"}' });
    const client = createRausgegangenClient({ apiKey: 'k', fetchImpl, backoffMs: 0 });
    await expect(client.putShow({ mapping_id: 's' })).resolves.toEqual({ id: 'x' });

    const failing = jest.fn().mockResolvedValue({ ok: false, status: 400, text: async () => '{"title":["Pflichtfeld"]}' });
    const strict = createRausgegangenClient({ apiKey: 'k', fetchImpl: failing, backoffMs: 0 });
    await expect(strict.putEvent({ mapping_id: 'e' })).rejects.toMatchObject({
      status: 400,
      retryable: false,
      message: expect.stringContaining('title: Pflichtfeld'),
    });
    expect(failing).toHaveBeenCalledTimes(1);
  });
});

describe('mapping', () => {
  it('turns our enum keys into API slugs', () => {
    expect(toApiSlug('AKTIV_UND_KREATIV')).toBe('aktiv-und-kreativ');
    expect(toApiSlug('BAR')).toBe('bar');
  });

  it('keeps only the HTML Rausgegangen allows', () => {
    const html = markdownToAllowedHtml('# Titel\n\nText mit *Betonung* und [Link](https://x.de)\n\n![bild](x.png)');
    expect(html).toContain('<h3>Titel</h3>');
    expect(html).toContain('<i>Betonung</i>');
    expect(html).toContain('<a href="https://x.de">Link</a>');
    expect(html).not.toMatch(/<img|<h1|<em/);
  });

  it('picks the first in-person session for the show', () => {
    const sessions = [
      session(2, '2026-11-10T17:00:00Z', '2026-11-10T19:00:00Z', [inKiel(2)]),
      session(1, '2026-11-03T17:00:00Z', '2026-11-03T19:00:00Z', [online(1)]),
    ];
    const picked = pickShowSession(sessions, courseLocations);
    expect(picked.session.id).toBe(2);
    expect(picked.locationAddress.id).toBe(3);
  });

  it('reports events without an in-person session', () => {
    const sessions = [session(1, '2026-11-03T17:00:00Z', null, [online(1)])];
    expect(pickShowSession(sessions, courseLocations).error).toMatch(/keine Präsenz-Termine/);
  });

  it('lists every session, online ones included, only for multi-session events', () => {
    const single = buildEventDescription({ course: baseCourse(), organizationName: 'oc', registrationUrl: null });
    expect(single).not.toContain('Termine');

    const multi = buildEventDescription({
      course: baseCourse({
        Sessions: [
          session(1, '2026-11-03T17:00:00Z', '2026-11-03T19:00:00Z', [inKiel(1)]),
          session(2, '2026-11-10T17:00:00Z', '2026-11-10T19:00:00Z', [online(2)]),
        ],
      }),
      organizationName: 'opencampus.sh',
      registrationUrl: 'https://edu.opencampus.sh/course/12',
    });
    expect(multi).toContain('<h3>Termine</h3>');
    expect(multi).toContain('18:00–20:00 Uhr');
    expect(multi).toContain('COBL, Legienstr. 40');
    expect(multi).toContain('online');
    expect(multi).toContain('Die Anmeldung gilt für alle Termine.');
    expect(multi).toContain('<a href="https://edu.opencampus.sh/course/12">Zur Anmeldung</a>');
  });

  it('sends an end date only for single-session events', () => {
    const course = baseCourse();
    const one = buildShowPayload({
      course,
      session: course.Sessions[0],
      mappingId: 's',
      eventId: 'e',
      locationId: 'l',
      soldOut: false,
      frontendUrl: 'https://edu.opencampus.sh',
      sessionCount: 1,
    });
    expect(one.end_date).toBe('2026-11-03T19:00:00.000Z');
    expect(one.ticket_url).toBe('https://edu.opencampus.sh/course/12');
    expect(one.state).toBe('takes_place');

    const many = buildShowPayload({ course, session: course.Sessions[0], mappingId: 's', sessionCount: 3, soldOut: true });
    expect(many.end_date).toBeUndefined();
    expect(many.state).toBe('sold_out');
  });

  it('links registration to the course page only while it is public', () => {
    expect(registrationUrlOf(baseCourse(), 'https://edu')).toBe('https://edu/course/12');
    expect(registrationUrlOf(baseCourse({ published: false }), 'https://edu')).toBeNull();
    expect(registrationUrlOf(baseCourse({ published: false, externalRegistrationLink: 'https://ext' }), 'https://edu')).toBe(
      'https://ext'
    );
  });

  it('formats prices and free events', () => {
    expect(formatPrice({ basePrice: 12.5 })).toBe('12.50');
    expect(formatPrice({ basePrice: null, cost: null })).toBe('0.00');
    expect(formatPrice({ basePrice: null, cost: 'Spende erbeten' })).toBeNull();
  });

  it('caps and normalizes tags', () => {
    const tags = normalizeTags(['KI', 'ki', ' Workshop ', '', ...Array.from({ length: 20 }, (_, i) => `t${i}`)]);
    expect(tags.slice(0, 2)).toEqual(['ki', 'workshop']);
    expect(tags).toHaveLength(12);
  });

  it('counts sold out like the capacity guard', () => {
    expect(isSoldOut({ maxParticipants: 20 }, 20)).toBe(true);
    expect(isSoldOut({ maxParticipants: 20 }, 19)).toBe(false);
    expect(isSoldOut({ maxParticipants: 0 }, 50)).toBe(false);
  });

  it('builds the event without unreachable local pictures', () => {
    const payload = buildEventPayload({
      course: baseCourse(),
      listing: { category: 'GESPROCHENES', tags: ['KI'] },
      mappingId: 'eduhub-event-12',
      published: true,
      bucketUrl: 'http://localhost:4001/emulated-bucket',
      frontendUrl: 'http://localhost:5000',
    });
    expect(payload).toMatchObject({
      mapping_id: 'eduhub-event-12',
      title: 'KI im Alltag',
      picture: null,
      picture_credits: 'Foto: opencampus',
      category: 'gesprochenes',
      tags: ['ki'],
      price: '0.00',
      published: true,
    });

    const live = buildEventPayload({
      course: baseCourse(),
      listing: { category: 'GESPROCHENES', tags: [] },
      mappingId: 'm',
      published: true,
      bucketUrl: 'https://storage.googleapis.com/eduhub-production',
    });
    expect(live.picture).toBe('https://storage.googleapis.com/eduhub-production/courses/course-12/public/cover-image/cover.jpg');
  });

  it('requires a complete address before creating a location', () => {
    expect(missingLocationFields(kiel)).toEqual([]);
    expect(missingLocationFields({ ...kiel, zipCode: '', latitude: null })).toEqual(['PLZ', 'Breitengrad']);
    expect(buildLocationPayload({ locationAddress: kiel, mappingId: 'l' })).toMatchObject({
      title: 'COBL',
      category: 'workspace',
      address_zipcode: '24103',
      lat: 54.3233,
    });
  });

  it('links only an unambiguous search match', () => {
    const results = [
      { id: 'a', address_street: 'Legienstraße 40', address_zipcode: '24103' },
      { id: 'b', address_street: 'Holtenauer Str. 1', address_zipcode: '24105' },
    ];
    expect(findMatchingLocation(results, kiel)?.id).toBe('a');
    expect(findMatchingLocation([...results, { id: 'c', address_street: 'Legienstr. 40', address_zipcode: '24103' }], kiel)).toBeNull();
  });
});

describe('syncCourse', () => {
  const previous = { ...process.env };
  beforeEach(() => {
    process.env.ENVIRONMENT = 'production';
    process.env.FRONTEND_URL = 'https://edu.opencampus.sh';
    process.env.STORAGE_BUCKET_PUBLIC_URL = 'https://storage.googleapis.com/eduhub-production';
    process.env.GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY = 'a'.repeat(64);
  });
  afterEach(() => {
    process.env = { ...previous };
  });

  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

  const encrypt = async (plaintext) => {
    const crypto = await import('crypto');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from('a'.repeat(64), 'hex'), iv);
    const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), ct.toString('base64')].join(':');
  };

  const graphql = (course) => {
    const writes = [];
    return {
      writes,
      request: jest.fn(async (query, variables) => {
        if (query.includes('RausgegangenCourse')) return { Course_by_pk: course };
        writes.push({ query, variables });
        return {};
      }),
    };
  };

  const fakeRausgegangen = () => ({
    putEvent: jest.fn().mockResolvedValue({ id: 'rg-event' }),
    patchEvent: jest.fn().mockResolvedValue({}),
    putShow: jest.fn().mockResolvedValue({ id: 'rg-show', public_url: 'https://rausgegangen.de/x', preview_url: 'https://rausgegangen.de/p' }),
    putLocation: jest.fn().mockResolvedValue({ id: 'rg-location' }),
    searchLocations: jest.fn().mockResolvedValue([]),
  });

  const courseWith = async ({ listing, featureActive = true, testMode = false, programPublished = true }) =>
    baseCourse({
      RausgegangenListing: { id: 7, enabled: true, category: 'GESPROCHENES', tags: [], rausgegangenEventId: null, ...listing },
      Program: {
        type: 'EVENTS',
        published: programPublished,
        Organization: {
          id: 1,
          name: 'opencampus.sh',
          rausgegangenApiKeyEncrypted: await encrypt('secret-key'),
          rausgegangenTestMode: testMode,
          Features: featureActive ? [{ id: 1 }] : [],
        },
      },
      CourseEnrollments_aggregate: { aggregate: { count: 3 } },
    });

  it('ignores courses without a listing', async () => {
    const client = graphql(baseCourse({ RausgegangenListing: null }));
    await expect(syncCourse({ client, courseId: 12, logger })).resolves.toBeNull();
  });

  it('creates location, event and one show and records the result', async () => {
    const client = graphql(await courseWith({}));
    const rg = fakeRausgegangen();
    let usedKey;
    const result = await syncCourse({
      client,
      courseId: 12,
      logger,
      createClient: ({ apiKey }) => {
        usedKey = apiKey;
        return rg;
      },
    });

    expect(usedKey).toBe('secret-key');
    expect(rg.searchLocations).toHaveBeenCalledWith({ city: 'Kiel', street: 'Legienstr. 40' });
    expect(rg.putLocation).toHaveBeenCalledWith(expect.objectContaining({ mapping_id: 'eduhub-location-3' }));
    expect(rg.putEvent).toHaveBeenCalledWith(expect.objectContaining({ mapping_id: 'eduhub-event-12', published: true }));
    expect(rg.putShow).toHaveBeenCalledTimes(1);
    expect(rg.putShow).toHaveBeenCalledWith(
      expect.objectContaining({ mapping_id: 'eduhub-event-12-show', event: 'rg-event', location: 'rg-location' })
    );
    expect(result).toMatchObject({ syncStatus: 'SYNCED', published: true, publicUrl: 'https://rausgegangen.de/x' });
    expect(client.writes.some((w) => w.variables.owned === true && w.variables.locationId === 'rg-location')).toBe(true);
  });

  it('keeps events unpublished in test mode', async () => {
    const client = graphql(await courseWith({ testMode: true }));
    const rg = fakeRausgegangen();
    const result = await syncCourse({ client, courseId: 12, logger, createClient: () => rg });
    expect(rg.putEvent).toHaveBeenCalledWith(expect.objectContaining({ published: false }));
    expect(result.published).toBe(false);
  });

  it('unpublishes a shared event when the feature was deactivated', async () => {
    const client = graphql(await courseWith({ featureActive: false, listing: { rausgegangenEventId: 'rg-event' } }));
    const rg = fakeRausgegangen();
    const result = await syncCourse({ client, courseId: 12, logger, createClient: () => rg });
    expect(rg.patchEvent).toHaveBeenCalledWith({ mapping_id: 'eduhub-event-12', published: false });
    expect(rg.putEvent).not.toHaveBeenCalled();
    expect(result).toMatchObject({ syncStatus: 'SKIPPED', published: false });
  });

  it('unpublishes when the editor disabled the listing', async () => {
    const client = graphql(await courseWith({ listing: { enabled: false, rausgegangenEventId: 'rg-event' } }));
    const rg = fakeRausgegangen();
    const result = await syncCourse({ client, courseId: 12, logger, createClient: () => rg });
    expect(rg.patchEvent).toHaveBeenCalled();
    expect(result).toMatchObject({ syncStatus: 'SKIPPED', syncError: null });
  });

  it('skips with a clear message when the address is incomplete', async () => {
    const course = await courseWith({});
    course.CourseLocations = [{ ...courseLocations[0], DefaultSessionAddress: { ...kiel, latitude: null } }];
    const rg = fakeRausgegangen();
    const result = await syncCourse({ client: graphql(course), courseId: 12, logger, createClient: () => rg });
    expect(rg.putEvent).not.toHaveBeenCalled();
    expect(result.syncError).toMatch(/unvollständig \(Breitengrad\)/);
  });

  it('reuses a linked third-party location without changing it', async () => {
    const course = await courseWith({});
    course.CourseLocations = [
      { ...courseLocations[0], DefaultSessionAddress: { ...kiel, rausgegangenLocationId: 'theirs', rausgegangenLocationOwned: false } },
    ];
    const rg = fakeRausgegangen();
    await syncCourse({ client: graphql(course), courseId: 12, logger, createClient: () => rg });
    expect(rg.putLocation).not.toHaveBeenCalled();
    expect(rg.searchLocations).not.toHaveBeenCalled();
    expect(rg.putShow).toHaveBeenCalledWith(expect.objectContaining({ location: 'theirs' }));
  });
});
