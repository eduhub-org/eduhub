import { titlesMustBeUnique } from '../../helpers/courseTitles';
import { CourseRegistrationType_enum } from '../../__generated__/globalTypes';
import { getEditableEmailTemplateTypes } from '../../utils/getEditableEmailTemplateTypes';
import { OperationError } from './errors';
import { countProposal } from './metrics';
import {
  fingerprint,
  mailFingerprint,
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
  MailTemplate,
  MailTemplateChange,
  MANAGING_ROLES,
  NewCourse,
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

export interface CreateCourseInput {
  programId: number;
  title: string;
  /** Course language; the texts are written in it. Defaults to DE. */
  language?: string;
  texts?: Partial<Record<Exclude<TextField, 'title'>, string>>;
  settings?: Partial<Record<Exclude<SettingField, 'language'>, unknown>>;
  /** Location options such as ONLINE or KIEL. Defaults to ONLINE. */
  locationOptions?: string[];
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
  /** Mail proposals only: placeholders and blocks the current mail has and the draft drops. */
  droppedPlaceholders?: string[];
}

interface Options {
  store: CourseStore;
  secret: string;
  now?: () => number;
}

export interface MailTemplateInput {
  courseId: number;
  /** A mail type from get_mail_templates, e.g. REGISTRATION_CONFIRMED. */
  type: string;
  subject?: string;
  content?: string;
}

const PAGE_SIZE = 100;

/** Told to the model, so it warns the Organizer before they apply a mail that lost its placeholders. */
export const droppedPlaceholdersNote = (dropped: string[]) =>
  `These placeholders are no longer in the mail: ${dropped.join(', ')}. ` +
  'Tell the Organizer, unless they asked for that.';

/** Placeholders and conditional blocks in a mail, e.g. [User:FirstName], [#if:Online]. */
const placeholders = (text: string) => new Set(text.match(/\[[#/]?[A-Za-z][\w:-]*\]/g) ?? []);

const PROPOSED_MESSAGE = 'Not saved yet. Show the Organizer before and after; only apply saves it.';

const pick = <T extends keyof CourseFields>(fields: CourseFields, keys: readonly T[]) =>
  Object.fromEntries(keys.map((k) => [k, fields[k]])) as Record<T, CourseFields[T]>;

const upper = (value: unknown) => (typeof value === 'string' ? value.toUpperCase() : value);

/** "18:00" → "18:00:00", as Hasura returns `time` columns. */
const normalizeTime = (value: unknown) =>
  typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;

/** An ISO 8601 date-time with `Z` or a numeric offset, so it never depends on the server's time zone. */
const isIsoDateTime = (value: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(value) && !isNaN(Date.parse(value));

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

  const issue = (
    who: Caller,
    kind: ProposalKind,
    courseId: number,
    proposalFingerprint: string,
    changes: ProposalPayload['changes'],
    before: unknown,
    after: unknown
  ): ProposedChangeResult => {
    const exp = Math.floor(now() / 1000) + PROPOSAL_TTL_SECONDS;
    const payload: ProposalPayload = {
      v: 1,
      kind,
      courseId,
      userId: who.userId,
      role: who.role,
      fingerprint: proposalFingerprint,
      changes,
      exp,
    };
    countProposal('created', kind);
    return {
      status: 'PROPOSED',
      proposedChangeId: signProposal(payload, secret),
      kind,
      courseId,
      before,
      after,
      expiresAt: new Date(exp * 1000).toISOString(),
      message: PROPOSED_MESSAGE,
    };
  };

  const propose = (
    who: Caller,
    course: CourseSnapshot,
    kind: Exclude<ProposalKind, 'create_course' | 'mail_template'>,
    changes: ProposalPayload['changes'],
    before: unknown,
    after: unknown
  ) => issue(who, kind, course.id, fingerprint(course, kind), changes, before, after);

  const assertMayCreateCourses = (who: Caller) => {
    if (who.role !== 'admin' && who.role !== 'org_admin') {
      throw new OperationError(
        'FORBIDDEN',
        'Only Org Admins and Admins can create courses. Instructors fill in the courses they are assigned to.'
      );
    }
  };

  const creatableProgram = async (who: Caller, programId: number) => {
    const program = await store.getCreatableProgram(who, programId);
    if (!program) {
      throw new OperationError('NOT_FOUND', `Program ${programId} does not exist or you can't create courses in it.`);
    }
    return program;
  };

  const assertInsertable = async (who: Caller, columns: string[]) => {
    const insertable = await store.insertableCourseColumns();
    const denied = columns.filter((c) => !insertable.has(c));
    if (denied.length) {
      throw new OperationError('FORBIDDEN', `Your role (${who.role}) can't set when creating a course: ${denied.join(', ')}.`);
    }
  };

  /**
   * Titles are unique per course or degree program, ignoring case and surrounding spaces. Event
   * programs are exempt (see helpers/courseTitles.ts).
   */
  const assertTitleFree = async (
    programType: string | null,
    programId: number,
    title: string,
    exceptCourseId?: number
  ) => {
    if (!titlesMustBeUnique(programType)) return;
    const taken = (await store.coursesTitled(programId, title.trim())).filter((c) => c.id !== exceptCourseId);
    if (taken.length) {
      throw new OperationError(
        'TITLE_TAKEN',
        `Program ${programId} already has a course named "${taken[0].title}" (course ${taken[0].id}). ` +
          'Course titles must be unique within a course or degree program; choose another title. If you just applied this ' +
          'proposal, that is the course it created.'
      );
    }
  };

  const normalizeSettings = (settings: Partial<Record<SettingField, unknown>>) => ({
    ...settings,
    ...(settings.language !== undefined && { language: upper(settings.language) }),
    ...(settings.weekDay !== undefined && { weekDay: upper(settings.weekDay) }),
    ...(settings.startTime !== undefined && { startTime: normalizeTime(settings.startTime) }),
    ...(settings.endTime !== undefined && { endTime: normalizeTime(settings.endTime) }),
  });

  const unknownKeys = (given: object, allowed: readonly string[], label: string) => {
    const unknown = Object.keys(given).filter((k) => !allowed.includes(k));
    if (unknown.length) throw new OperationError('INVALID', `Unknown ${label}: ${unknown.join(', ')}.`);
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

  const assertMayChangeMails = (who: Caller) => {
    if (who.role !== 'admin' && who.role !== 'org_admin') {
      throw new OperationError(
        'FORBIDDEN',
        'Only Org Admins and Admins can change the mails of a course. Instructors can read them; ask an Org Admin.'
      );
    }
  };

  /** The mails the course sends, each from its own copy or the default. */
  const courseMails = async (course: CourseSnapshot) => {
    const mails = await store.getCourseMails(course.id);
    const editableFor = (registrationType: string | null) =>
      getEditableEmailTemplateTypes({
        registrationType: registrationType as CourseRegistrationType_enum | null,
        attendanceCertificatePossible: course.fields.attendanceCertificatePossible as boolean | null,
        achievementCertificatePossible: course.fields.achievementCertificatePossible as boolean | null,
      });
    // Instructors can't read the registration type of an unpublished course (public_Course.yaml), so
    // they get the mails of every registration type. Only Org Admins and Admins, who can read it, change mails.
    const editable = mails.registrationType
      ? editableFor(mails.registrationType)
      : Object.values(CourseRegistrationType_enum).flatMap(editableFor);
    // Copies made earlier for types no longer offered are still sent, so they stay listed.
    const types = [...new Set([...editable, ...mails.course.map((m) => m.type)])];
    const byType = (list: MailTemplate[]) => new Map(list.map((m) => [m.type, m]));
    const copies = byType(mails.course);
    const defaults = byType(mails.defaults);
    return { registrationType: mails.registrationType, types, copies, defaults };
  };

  const applyMailTemplate = async (who: Caller, proposal: ProposalPayload) => {
    assertMayChangeMails(who);
    const course = await managedCourse(who, proposal.courseId);
    const change = proposal.changes as MailTemplateChange;
    const { copies, defaults } = await courseMails(course);
    const copy = copies.get(change.type);
    if (mailFingerprint(copy) !== proposal.fingerprint) {
      throw new OperationError(
        'STALE',
        `This mail of course ${course.id} has changed since the change was proposed, so it was not applied. ` +
          'Read the mails again and ask for a new proposal.'
      );
    }
    const base = defaults.get(change.type);
    if (!copy && !base) throw new OperationError('NOT_FOUND', `There is no default mail of type ${change.type}.`);
    const saved = await store.saveCourseMail(course.id, change, copy ? { existing: copy } : { base: base as MailTemplate });
    if (!saved) {
      throw new OperationError('STALE', `The mail changed while applying, or you can't change it; nothing was saved.`);
    }
    countProposal('applied', 'mail_template');
    return { status: 'APPLIED' as const, kind: 'mail_template' as const, courseId: course.id };
  };

  const applyCreateCourse = async (who: Caller, proposal: ProposalPayload) => {
    assertMayCreateCourses(who);
    const course = proposal.changes as NewCourse;
    const program = await creatableProgram(who, course.programId);
    // Titles are unique per program. This also stops a second apply of the same proposal, which
    // would find the course the first one created.
    await assertTitleFree(program.type, program.id, String(course.fields.title));
    await assertInsertable(who, Object.keys(course.fields));
    const courseId = await store.createCourse(course);
    countProposal('applied', 'create_course');
    return { status: 'APPLIED' as const, kind: 'create_course' as const, courseId, programId: program.id };
  };

  return {
    /** Pages of 100, newest first; pass `nextBeforeId` back as `beforeId` for the next page. */
    async listCourses({ beforeId }: { beforeId?: number } = {}) {
      const who = await caller();
      const rows = await store.listManagedCourses(who, { beforeId, limit: PAGE_SIZE + 1 });
      const courses = rows.slice(0, PAGE_SIZE);
      const hasMore = rows.length > PAGE_SIZE;
      return { courses, hasMore, ...(hasMore && { nextBeforeId: courses[courses.length - 1].id }) };
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
      const { changed, before, after } = fieldDiff<TextField>(course, {
        ...texts,
        ...(texts.title !== undefined && { title: texts.title.trim() }),
      });
      await assertSettable(who, changed);
      if (typeof after.title === 'string') await assertTitleFree(course.programType, course.programId, after.title, course.id);
      return propose(who, course, 'course_texts', after, before, after);
    },

    async proposeCourseSettings({ courseId, settings }: { courseId: number; settings: Partial<Record<SettingField, unknown>> }) {
      const who = await caller();
      const course = await managedCourse(who, courseId);
      const unknown = Object.keys(settings).filter((k) => !(SETTING_FIELDS as readonly string[]).includes(k));
      if (unknown.length) throw new OperationError('INVALID', `Unknown settings: ${unknown.join(', ')}.`);
      const normalized = normalizeSettings(settings);
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

    /** Programs the caller may create courses in (empty for instructors). */
    /** Pages of 100, newest first; pass `nextBeforeId` back as `beforeId` for the next page. */
    async listPrograms({ beforeId }: { beforeId?: number } = {}) {
      const who = await caller();
      const rows = await store.listCreatablePrograms(who, { beforeId, limit: PAGE_SIZE + 1 });
      const programs = rows.slice(0, PAGE_SIZE);
      const hasMore = rows.length > PAGE_SIZE;
      return { programs, hasMore, ...(hasMore && { nextBeforeId: programs[programs.length - 1].id }) };
    },

    async proposeCreateCourse({ programId, title, language, texts = {}, settings = {}, locationOptions }: CreateCourseInput) {
      const who = await caller();
      assertMayCreateCourses(who);
      const program = await creatableProgram(who, programId);
      title = title.trim();
      if (!title) throw new OperationError('INVALID', 'A new course needs a title.');
      await assertTitleFree(program.type, programId, title);
      unknownKeys(texts, TEXT_FIELDS.filter((f) => f !== 'title'), 'text fields');
      unknownKeys(settings, SETTING_FIELDS.filter((f) => f !== 'language'), 'settings');

      // The same defaults as "add" on the manage courses page.
      const today = new Date(now()).toISOString().slice(0, 10);
      const applicationEnd =
        program.defaultApplicationEnd && program.defaultApplicationEnd > today ? program.defaultApplicationEnd : today;
      const fields = Object.fromEntries(
        Object.entries({
          title,
          tagline: '',
          language: upper(language ?? 'DE'),
          applicationEnd,
          maxMissedSessions: 2,
          ...texts,
          ...normalizeSettings(settings),
        }).filter(([, v]) => v !== undefined)
      ) as Partial<CourseFields>;

      const known = await store.locationOptions();
      const options = [...new Set((locationOptions ?? ['ONLINE']).map((o) => String(upper(o))))];
      const unknownOptions = options.filter((o) => !known.includes(o));
      if (unknownOptions.length || !options.length) {
        throw new OperationError(
          'INVALID',
          `Unknown location options: ${unknownOptions.join(', ') || 'none given'}. Choose from ${known.join(', ')}.`
        );
      }
      await assertInsertable(who, Object.keys(fields));

      const newCourse: NewCourse = { programId, fields, locationOptions: options };
      return issue(who, 'create_course', 0, 'new', newCourse, null, {
        program: { id: program.id, title: program.title, organization: program.organization },
        ...fields,
        locationOptions: options,
      });
    },

    /**
     * The mails the course sends to participants, each with whether the course has its own copy.
     * Instructors may read them; only Org Admins and Admins may change them.
     */
    async getMailTemplates({ courseId }: { courseId: number }) {
      const course = await managedCourse(await caller(), courseId);
      const { registrationType, types, copies, defaults } = await courseMails(course);
      return {
        courseId,
        registrationType,
        mails: types.flatMap((type) => {
          const mail = copies.get(type) ?? defaults.get(type);
          return mail ? [{ type, customized: copies.has(type), subject: mail.subject, content: mail.content }] : [];
        }),
      };
    },

    async proposeMailTemplate({ courseId, type, subject, content }: MailTemplateInput) {
      const who = await caller();
      const course = await managedCourse(who, courseId);
      assertMayChangeMails(who);
      const mailType = type.toUpperCase();
      const { registrationType, types, copies, defaults } = await courseMails(course);
      if (!registrationType) {
        throw new OperationError('FORBIDDEN', `You can't read the registration type of course ${courseId}, so you can't change its mails.`);
      }
      if (!types.includes(mailType)) {
        throw new OperationError(
          'INVALID',
          `Course ${courseId} doesn't send a ${mailType} mail it could change. Its mails are: ${types.join(', ') || 'none'}.`
        );
      }
      const current = copies.get(mailType) ?? defaults.get(mailType);
      if (!current) throw new OperationError('NOT_FOUND', `There is no default mail of type ${mailType}.`);
      if (subject === undefined && content === undefined) throw new OperationError('INVALID', 'Nothing to change was given.');
      const next = { subject: subject ?? current.subject, content: content ?? current.content };
      if (!next.subject.trim() || !next.content.trim()) {
        throw new OperationError('INVALID', 'A mail needs a subject and a text.');
      }
      if (next.subject === current.subject && next.content === current.content) {
        throw new OperationError('NO_CHANGE', 'The mail already reads like this.');
      }
      const kept = placeholders(next.subject + next.content);
      const dropped = [...placeholders(current.subject + current.content)].filter((p) => !kept.has(p));

      const change: MailTemplateChange = { type: mailType, ...next };
      const before = { mailType, subject: current.subject, content: current.content };
      const after = { mailType, ...next };
      const result = issue(who, 'mail_template', course.id, mailFingerprint(copies.get(mailType)), change, before, after);
      return dropped.length
        ? {
            ...result,
            droppedPlaceholders: dropped,
            message: `${result.message} ${droppedPlaceholdersNote(dropped)}`,
          }
        : result;
    },

    async applyProposedChange({ proposedChangeId }: { proposedChangeId: string }) {
      const who = await caller();
      const proposal = verifyProposal(proposedChangeId, secret, now());
      if (proposal.userId !== who.userId || proposal.role !== who.role) {
        throw new OperationError('FORBIDDEN', 'This Proposed Change was made for someone else or another role.');
      }
      if (proposal.kind === 'create_course') return applyCreateCourse(who, proposal);
      if (proposal.kind === 'mail_template') return applyMailTemplate(who, proposal);

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
        const changes = proposal.changes as SessionChanges;
        const current = new Map(course.sessions.map((s) => [s.id, s]));
        // Check the times again against the Sessions as they are now.
        changes.update.forEach((u) => {
          const s = current.get(u.sessionId) as CourseSession;
          checkTimes(`Session ${u.sessionId}`, u.set.startDateTime ?? s.startDateTime, u.set.endDateTime ?? s.endDateTime);
        });
        await store.applySessionChanges(course.id, changes);
      } else {
        const set = proposal.changes as Partial<CourseFields>;
        await assertSettable(who, Object.keys(set));
        if (typeof set.title === 'string') await assertTitleFree(course.programType, course.programId, set.title, course.id);
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

    /**
     * Proposals are not stored, so discarding can't revoke one: it only confirms that nothing was
     * saved. The client must drop the proposedChangeId; it stays valid until it expires.
     */
    async discardProposedChange({ proposedChangeId }: { proposedChangeId: string }) {
      await caller();
      try {
        verifyProposal(proposedChangeId, secret, now());
      } catch (error) {
        // An expired proposal can't be applied anyway, so discarding it is fine.
        if (!(error instanceof OperationError && error.code === 'EXPIRED')) throw error;
      }
      return {
        status: 'DISCARDED',
        message: 'Nothing was saved. Forget this proposedChangeId; the server does not revoke it.',
      };
    },
  };
};

export type CourseSetup = ReturnType<typeof createCourseSetup>;
