import { OperationError } from './errors';
import { countProposal } from './metrics';
import {
  fingerprint,
  PROPOSAL_TTL_SECONDS,
  ProposalKind,
  ProposalPayload,
  signProposal,
  verifyProposal,
} from './proposals';
import {
  Caller,
  CourseFields,
  CourseSession,
  CourseSnapshot,
  CourseStore,
  MANAGING_ROLES,
  NewSession,
  SessionChanges,
  SessionLocation,
  SessionUpdate,
  SETTING_FIELDS,
  SettingField,
  TEXT_FIELDS,
  TextField,
} from './types';

/**
 * The course-setup operations of the EduHub MCP server (ADR 0006). Reads return course data;
 * every write is a Proposed Change that only `applyProposedChange` saves, after checking the rules
 * again. All Hasura access goes through `store`, which uses the caller's own token and role.
 */

export interface LocationInput {
  courseLocationId: number;
  /** Defaults to the location option's default Session address. */
  address?: string;
}

export interface NewSessionInput {
  title: string;
  startDateTime: string;
  endDateTime: string;
  description?: string;
  /** Defaults to every location option of the course with its default address. */
  locations?: LocationInput[];
}

export interface SessionChangeInput {
  sessionId: number;
  title?: string;
  startDateTime?: string;
  endDateTime?: string;
  description?: string;
  /** Replaces all Session Locations of the Session. */
  locations?: LocationInput[];
}

export interface ProposeSessionsInput {
  courseId: number;
  sessions?: NewSessionInput[];
  changes?: SessionChangeInput[];
  deleteSessionIds?: number[];
}

export interface ProposedChangeResult {
  status: 'PROPOSED';
  /** Hand this back to `apply_proposed_change` to save the change. */
  proposedChangeId: string;
  kind: ProposalKind;
  courseId: number;
  before: unknown;
  after: unknown;
  expiresAt: string;
  message: string;
}

interface Options {
  store: CourseStore;
  secret: string;
  now?: () => number;
}

const PROPOSED_MESSAGE = 'Not saved yet. Show the Organizer before and after; only apply saves it.';

const pick = <T extends keyof CourseFields>(fields: CourseFields, keys: readonly T[]) =>
  Object.fromEntries(keys.map((k) => [k, fields[k]])) as Record<T, CourseFields[T]>;

const upper = (value: unknown) => (typeof value === 'string' ? value.toUpperCase() : value);

/** "18:00" → "18:00:00", as Hasura returns `time` columns. */
const normalizeTime = (value: unknown) =>
  typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;

const isIsoDateTime = (value: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) && !isNaN(Date.parse(value));

export const createCourseSetup = ({ store, secret, now = Date.now }: Options) => {
  if (!secret) throw new Error('A proposal signing secret is required.');

  const caller = async (): Promise<Caller> => {
    const verified = await store.verifyCaller();
    if (!(MANAGING_ROLES as readonly string[]).includes(verified.role)) {
      throw new OperationError(
        'FORBIDDEN',
        `Course setup needs the instructor, org_admin or admin role; this request uses "${verified.role}".`
      );
    }
    return verified;
  };

  const managedCourse = async (who: Caller, courseId: number): Promise<CourseSnapshot> => {
    const course = await store.getManagedCourse(who, courseId);
    if (!course) {
      throw new OperationError('NOT_FOUND', `Course ${courseId} does not exist or you can't manage it.`);
    }
    return course;
  };

  const assertNoRegistrations = (course: CourseSnapshot) => {
    if (course.registrationCount > 0) {
      throw new OperationError(
        'REGISTRATIONS_EXIST',
        `Sessions can't be changed here because ${course.registrationCount} people have already registered ` +
          'for this course. Change them by hand on the course page and send the Session Change Notification.'
      );
    }
  };

  const assertSettable = async (who: Caller, columns: string[]) => {
    const settable = await store.settableCourseColumns();
    const denied = columns.filter((c) => !settable.has(c));
    if (denied.length) {
      throw new OperationError('FORBIDDEN', `Your role (${who.role}) can't change: ${denied.join(', ')}.`);
    }
  };

  const propose = (
    who: Caller,
    course: CourseSnapshot,
    kind: ProposalKind,
    changes: ProposalPayload['changes'],
    before: unknown,
    after: unknown
  ): ProposedChangeResult => {
    const exp = Math.floor(now() / 1000) + PROPOSAL_TTL_SECONDS;
    const payload: ProposalPayload = {
      v: 1,
      kind,
      courseId: course.id,
      userId: who.userId,
      role: who.role,
      fingerprint: fingerprint(course, kind),
      changes,
      exp,
    };
    countProposal('created', kind);
    return {
      status: 'PROPOSED',
      proposedChangeId: signProposal(payload, secret),
      kind,
      courseId: course.id,
      before,
      after,
      expiresAt: new Date(exp * 1000).toISOString(),
      message: PROPOSED_MESSAGE,
    };
  };

  /** Only the fields that differ from the course; refuses an empty change. */
  const fieldDiff = <T extends TextField | SettingField>(course: CourseSnapshot, wanted: Partial<Record<T, unknown>>) => {
    const keys = Object.keys(wanted).filter((k) => wanted[k as T] !== undefined) as T[];
    if (!keys.length) throw new OperationError('INVALID', 'Nothing to change was given.');
    const changed = keys.filter((k) => wanted[k] !== course.fields[k]);
    if (!changed.length) throw new OperationError('NO_CHANGE', 'These values are already set on the course.');
    const before = pick(course.fields, changed);
    const after = Object.fromEntries(changed.map((k) => [k, wanted[k]])) as Partial<CourseFields>;
    return { changed, before, after };
  };

  const resolveLocations = (course: CourseSnapshot, input: LocationInput[] | undefined): SessionLocation[] => {
    const options = new Map(course.courseLocations.map((o) => [o.id, o]));
    const wanted: LocationInput[] = input ?? course.courseLocations.map((o) => ({ courseLocationId: o.id }));
    return wanted.map(({ courseLocationId, address }) => {
      const option = options.get(courseLocationId);
      if (!option) {
        throw new OperationError(
          'INVALID',
          `Location option ${courseLocationId} doesn't belong to course ${course.id}. ` +
            `Its options are: ${course.courseLocations.map((o) => `${o.id} (${o.locationOption})`).join(', ') || 'none'}.`
        );
      }
      return address === undefined
        ? { courseLocationId, address: option.defaultSessionAddress, locationAddressId: option.defaultSessionAddressId }
        : { courseLocationId, address, locationAddressId: null };
    });
  };

  const checkTimes = (label: string, start: string, end: string) => {
    if (!isIsoDateTime(start) || !isIsoDateTime(end)) {
      throw new OperationError('INVALID', `${label}: start and end must be ISO 8601 date-times with an offset.`);
    }
    if (Date.parse(end) <= Date.parse(start)) {
      throw new OperationError('INVALID', `${label}: the end must be after the start.`);
    }
  };

  return {
    async listCourses() {
      const who = await caller();
      return { courses: await store.listManagedCourses(who) };
    },

    async getCourse({ courseId }: { courseId: number }) {
      const course = await managedCourse(await caller(), courseId);
      return {
        id: course.id,
        updatedAt: course.updatedAt,
        programType: course.programType,
        ...course.fields,
        registrationCount: course.registrationCount,
        sessionsChangeable: course.registrationCount === 0,
        courseLocations: course.courseLocations,
        sessions: course.sessions,
      };
    },

    async getRegistrationCount({ courseId }: { courseId: number }) {
      const course = await managedCourse(await caller(), courseId);
      return { courseId, registrationCount: course.registrationCount, sessionsChangeable: course.registrationCount === 0 };
    },

    async proposeCourseTexts({
      courseId,
      language,
      texts,
    }: {
      courseId: number;
      language?: string;
      texts: Partial<Record<TextField, string>>;
    }) {
      const who = await caller();
      const course = await managedCourse(who, courseId);
      const courseLanguage = course.fields.language;
      if (language && upper(language) !== courseLanguage) {
        throw new OperationError(
          'INVALID',
          `Course ${courseId} is written in ${courseLanguage}; a course has one set of texts in its own language. ` +
            'Write the texts in that language, or first propose a different course language as a setting.'
        );
      }
      const unknown = Object.keys(texts).filter((k) => !(TEXT_FIELDS as readonly string[]).includes(k));
      if (unknown.length) throw new OperationError('INVALID', `Unknown text fields: ${unknown.join(', ')}.`);
      const { changed, before, after } = fieldDiff<TextField>(course, texts);
      await assertSettable(who, changed);
      return propose(who, course, 'course_texts', after, before, after);
    },

    async proposeCourseSettings({ courseId, settings }: { courseId: number; settings: Partial<Record<SettingField, unknown>> }) {
      const who = await caller();
      const course = await managedCourse(who, courseId);
      const unknown = Object.keys(settings).filter((k) => !(SETTING_FIELDS as readonly string[]).includes(k));
      if (unknown.length) throw new OperationError('INVALID', `Unknown settings: ${unknown.join(', ')}.`);
      const normalized: Partial<Record<SettingField, unknown>> = {
        ...settings,
        ...(settings.language !== undefined && { language: upper(settings.language) }),
        ...(settings.weekDay !== undefined && { weekDay: upper(settings.weekDay) }),
        ...(settings.startTime !== undefined && { startTime: normalizeTime(settings.startTime) }),
        ...(settings.endTime !== undefined && { endTime: normalizeTime(settings.endTime) }),
      };
      const { changed, before, after } = fieldDiff<SettingField>(course, normalized);
      await assertSettable(who, changed);
      return propose(who, course, 'course_settings', after, before, after);
    },

    async proposeSessions({ courseId, sessions = [], changes = [], deleteSessionIds = [] }: ProposeSessionsInput) {
      const who = await caller();
      const course = await managedCourse(who, courseId);
      assertNoRegistrations(course);
      if (!sessions.length && !changes.length && !deleteSessionIds.length) {
        throw new OperationError('INVALID', 'Give Sessions to add, change or delete.');
      }
      const existing = new Map(course.sessions.map((s) => [s.id, s]));
      const touched = [...changes.map((c) => c.sessionId), ...deleteSessionIds];
      const foreign = touched.filter((id) => !existing.has(id));
      if (foreign.length) {
        throw new OperationError('INVALID', `Sessions ${foreign.join(', ')} don't belong to course ${courseId}.`);
      }
      if (new Set(touched).size !== touched.length) {
        throw new OperationError('INVALID', 'Each Session can only be changed or deleted once per proposal.');
      }

      const create: NewSession[] = sessions.map((s, i) => {
        checkTimes(`New Session ${i + 1}`, s.startDateTime, s.endDateTime);
        return {
          title: s.title,
          description: s.description ?? '',
          startDateTime: s.startDateTime,
          endDateTime: s.endDateTime,
          locations: resolveLocations(course, s.locations),
        };
      });
      const update: SessionUpdate[] = changes.map((c) => {
        const current = existing.get(c.sessionId) as CourseSession;
        const set = Object.fromEntries(
          (['title', 'description', 'startDateTime', 'endDateTime'] as const)
            .filter((k) => c[k] !== undefined)
            .map((k) => [k, c[k]])
        ) as SessionUpdate['set'];
        checkTimes(`Session ${c.sessionId}`, set.startDateTime ?? current.startDateTime, set.endDateTime ?? current.endDateTime);
        const locations = c.locations ? resolveLocations(course, c.locations) : undefined;
        if (!Object.keys(set).length && !locations) {
          throw new OperationError('INVALID', `Session ${c.sessionId}: nothing to change was given.`);
        }
        return { sessionId: c.sessionId, set, ...(locations && { locations }) };
      });
      const sessionChanges: SessionChanges = { create, update, delete: deleteSessionIds };

      const before = touched.map((id) => existing.get(id));
      const after = [
        ...update.map((u) => {
          const current = existing.get(u.sessionId) as CourseSession;
          return { ...current, ...u.set, locations: u.locations ?? current.locations };
        }),
        ...create.map((s) => ({ id: null, ...s })),
      ];
      return propose(who, course, 'sessions', sessionChanges, { sessions: before, deletedSessionIds: deleteSessionIds }, {
        sessions: after,
      });
    },

    async applyProposedChange({ proposedChangeId }: { proposedChangeId: string }) {
      const who = await caller();
      const proposal = verifyProposal(proposedChangeId, secret, now());
      if (proposal.userId !== who.userId || proposal.role !== who.role) {
        throw new OperationError('FORBIDDEN', 'This Proposed Change was made for someone else or another role.');
      }
      const course = await managedCourse(who, proposal.courseId);
      if (fingerprint(course, proposal.kind) !== proposal.fingerprint) {
        throw new OperationError(
          'STALE',
          `Course ${course.id} has changed since this change was proposed, so it was not applied. ` +
            'Read the course again and ask for a new proposal.'
        );
      }

      if (proposal.kind === 'sessions') {
        assertNoRegistrations(course);
        await store.applySessionChanges(course.id, proposal.changes as SessionChanges);
      } else {
        const set = proposal.changes as Partial<CourseFields>;
        await assertSettable(who, Object.keys(set));
        const saved = await store.updateCourse(course.id, course.updatedAt, set);
        if (!saved) {
          throw new OperationError(
            'STALE',
            `Course ${course.id} changed while applying, or you can't update it; nothing was saved.`
          );
        }
      }
      countProposal('applied', proposal.kind);
      return { status: 'APPLIED', kind: proposal.kind, courseId: course.id };
    },

    /** Proposals are not stored, so discarding just confirms that nothing will be saved. */
    async discardProposedChange({ proposedChangeId }: { proposedChangeId: string }) {
      await caller();
      try {
        verifyProposal(proposedChangeId, secret, now());
      } catch (error) {
        // An expired proposal can't be applied anyway, so discarding it is fine.
        if (!(error instanceof OperationError && error.code === 'EXPIRED')) throw error;
      }
      return { status: 'DISCARDED', message: 'Nothing was saved.' };
    },
  };
};

export type CourseSetup = ReturnType<typeof createCourseSetup>;
