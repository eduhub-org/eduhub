import { OperationError } from '../errors';
import { CourseSnapshot, CourseStore, MailTemplate, SETTING_FIELDS, SessionChanges, TEXT_FIELDS } from '../types';

/**
 * In-memory CourseStore for tests. It models the parts of Hasura's permissions the operations rely
 * on: which roles a token allows, which courses a role may manage (instructor of the course, org
 * admin of the program's organization, admin) and which Course columns a role may update.
 */

export interface FakeCourse extends Omit<CourseSnapshot, 'registrationCount'> {
  /** Also part of the snapshot; repeated here for readability of the seed data. */
  programId: number;
  organizationId: number;
  instructorIds: string[];
  registrations: number;
  /** Default APPROVAL_WITH_INPUT, as the column default. */
  registrationType?: string;
}

/** A mail template row; courseId null for a system default. */
export interface FakeMail extends MailTemplate {
  courseId: number | null;
}

export interface FakeProgram {
  id: number;
  title: string;
  organizationId: number;
  defaultApplicationEnd: string | null;
  type?: string;
}

export interface FakeWorld {
  programs: FakeProgram[];
  courses: FakeCourse[];
  /** userId → roles the token allows (x-hasura-allowed-roles). */
  allowedRoles: Record<string, string[]>;
  /** userId → organizations they are an Org Admin of (with the matching capability). */
  orgAdminOf: Record<string, number[]>;
  mails: FakeMail[];
}

/** Instructors can't update these columns in Hasura (see public_Course.yaml). */
const NOT_SETTABLE_BY_INSTRUCTOR = ['applicationEnd', 'attendanceCertificatePossible', 'achievementCertificatePossible'];
/** Org Admins can't set this column when creating a course (see public_Course.yaml). */
const NOT_INSERTABLE = ['sessionReminderLeadHours'];

let clock = Date.parse('2026-11-22T10:00:00Z');
const nextTimestamp = () => new Date((clock += 1000)).toISOString();

export const createFakeCourseStore = (world: FakeWorld, userId: string, role: string): CourseStore => {
  const manages = (c: FakeCourse) =>
    role === 'admin' ||
    (role === 'instructor' && c.instructorIds.includes(userId)) ||
    (role === 'org_admin' && (world.orgAdminOf[userId] ?? []).includes(c.organizationId));

  const snapshot = (c: FakeCourse): CourseSnapshot => {
    const { organizationId, instructorIds, registrations, ...rest } = structuredClone(c);
    void organizationId;
    void instructorIds;
    return { ...rest, registrationCount: registrations };
  };

  const find = (courseId: number) => world.courses.find((c) => c.id === courseId);
  const mayCreateIn = (p: FakeProgram) =>
    role === 'admin' || (role === 'org_admin' && (world.orgAdminOf[userId] ?? []).includes(p.organizationId));
  const toSummary = (p: FakeProgram) => ({
    id: p.id,
    title: p.title,
    type: p.type ?? 'COURSES',
    organization: `Org ${p.organizationId}`,
    defaultApplicationEnd: p.defaultApplicationEnd,
  });

  return {
    async verifyCaller() {
      if (!(world.allowedRoles[userId] ?? []).includes(role)) {
        throw new OperationError('UNAUTHENTICATED', `Hasura refused the token or role "${role}".`);
      }
      return { userId, role };
    },
    async listManagedCourses(_caller, { beforeId, limit }) {
      return [...world.courses]
        .filter(manages)
        .filter((c) => beforeId === undefined || c.id < beforeId)
        .sort((a, b) => b.id - a.id)
        .slice(0, limit)
        .map((c) => ({
        id: c.id,
        title: String(c.fields.title),
        language: String(c.fields.language),
        status: null,
        programType: c.programType,
        registrationCount: c.registrations,
      }));
    },
    async getManagedCourse(_caller, courseId) {
      const c = find(courseId);
      return c && manages(c) ? snapshot(c) : null;
    },
    async settableCourseColumns() {
      if (role === 'user') return new Set();
      const all = [...TEXT_FIELDS, ...SETTING_FIELDS] as string[];
      return new Set(role === 'instructor' ? all.filter((f) => !NOT_SETTABLE_BY_INSTRUCTOR.includes(f)) : all);
    },
    async updateCourse(courseId, expectedUpdatedAt, set) {
      const c = find(courseId);
      if (!c || !manages(c) || c.updatedAt !== expectedUpdatedAt) return false;
      Object.assign(c.fields, set);
      c.updatedAt = nextTimestamp();
      return true;
    },
    async applySessionChanges(courseId, changes: SessionChanges) {
      const c = find(courseId);
      if (!c || !manages(c)) throw new OperationError('HASURA_ERROR', 'permission denied');
      c.sessions = c.sessions.filter((s) => !changes.delete.includes(s.id));
      changes.update.forEach((u) => {
        const s = c.sessions.find((x) => x.id === u.sessionId);
        if (s) Object.assign(s, u.set, u.locations ? { locations: u.locations } : {}, { updatedAt: nextTimestamp() });
      });
      changes.create.forEach((s) => {
        c.sessions.push({ id: Math.max(0, ...c.sessions.map((x) => x.id)) + 1, updatedAt: null, ...s });
      });
    },
    async listCreatablePrograms(_caller, { beforeId, limit }) {
      return [...world.programs]
        .filter(mayCreateIn)
        .filter((p) => beforeId === undefined || p.id < beforeId)
        .sort((a, b) => b.id - a.id)
        .slice(0, limit)
        .map(toSummary);
    },
    async getCreatableProgram(_caller, programId) {
      const p = world.programs.find((x) => x.id === programId);
      return p && mayCreateIn(p) ? toSummary(p) : null;
    },
    async insertableCourseColumns() {
      if (role !== 'admin' && role !== 'org_admin') return new Set();
      const all = [...TEXT_FIELDS, ...SETTING_FIELDS] as string[];
      return new Set(role === 'admin' ? all : all.filter((f) => !NOT_INSERTABLE.includes(f)));
    },
    async locationOptions() {
      return ['ONLINE', 'KIEL', 'HEIDE', 'HAMBURG'];
    },
    async coursesTitled(programId, title) {
      return world.courses
        .filter((c) => c.programId === programId && String(c.fields.title).toLowerCase() === title.toLowerCase())
        .map((c) => ({ id: c.id, title: String(c.fields.title) }));
    },
    async createCourse({ programId, fields: set, locationOptions: options }) {
      const program = world.programs.find((x) => x.id === programId);
      if (!program || !mayCreateIn(program)) throw new OperationError('HASURA_ERROR', 'check constraint violation');
      const id = Math.max(...world.courses.map((c) => c.id)) + 1;
      world.courses.push({
        id,
        programId,
        updatedAt: nextTimestamp(),
        programType: program.type ?? 'COURSES',
        organizationId: program.organizationId,
        instructorIds: [],
        registrations: 0,
        fields: { ...fields(String(set.title)), ...set },
        courseLocations: options.map((o, i) => ({
          id: id * 100 + i,
          locationOption: o,
          defaultSessionAddress: '',
          defaultSessionAddressId: null,
        })),
        sessions: [],
      });
      return id;
    },
    async getCourseMails(courseId) {
      const c = find(courseId);
      // Instructors read their courses' mails; only Org Admins and admins may write them (MailTemplate.yaml).
      const visible = c && manages(c);
      const strip = (row: FakeMail): MailTemplate => {
        const { courseId: _courseId, ...m } = structuredClone(row);
        void _courseId;
        return m;
      };
      return {
        // Instructors can't read it on unpublished courses (public_Course.yaml); the seed courses are unpublished.
        registrationType: visible && role !== 'instructor' ? c.registrationType ?? 'APPROVAL_WITH_INPUT' : null,
        course: visible ? world.mails.filter((m) => m.courseId === courseId).map(strip) : [],
        defaults: world.mails.filter((m) => m.courseId === null).map(strip),
      };
    },
    async saveCourseMail(courseId, { type, subject, content }, target) {
      const c = find(courseId);
      if (!c || !manages(c) || (role !== 'admin' && role !== 'org_admin')) return false;
      if ('existing' in target) {
        const row = world.mails.find((m) => m.id === target.existing.id && m.updatedAt === target.existing.updatedAt);
        if (!row) return false;
        Object.assign(row, { subject, content, updatedAt: nextTimestamp() });
        return true;
      }
      // Hasura's unique (type, courseId) constraint; the real store reports it as not saved.
      if (world.mails.some((m) => m.courseId === courseId && m.type === type)) return false;
      const { from, cc, bcc } = target.base;
      world.mails.push({
        id: Math.max(0, ...world.mails.map((m) => m.id)) + 1,
        courseId,
        type,
        subject,
        content,
        from,
        cc,
        bcc,
        updatedAt: nextTimestamp(),
      });
      return true;
    },
  };
};

const mail = (id: number, type: string, courseId: number | null, subject: string, content: string): FakeMail => ({
  id,
  type,
  courseId,
  subject,
  content,
  from: 'edu@example.org',
  cc: null,
  bcc: null,
  updatedAt: '2026-11-01T09:00:00+00:00',
});

const fields = (title: string, language = 'DE') => ({
  title,
  tagline: 'Kurz',
  learningGoals: 'Ziele',
  headingDescriptionField1: 'Worum geht es?',
  contentDescriptionField1: 'Inhalt',
  headingDescriptionField2: null,
  contentDescriptionField2: null,
  maxParticipants: 20,
  applicationEnd: '2027-01-10',
  maxMissedSessions: 2,
  language,
  weekDay: 'TUESDAY',
  startTime: '18:00:00',
  endTime: '19:30:00',
  sessionReminderLeadHours: 24,
  showAvailablePlaces: true,
  attendanceCertificatePossible: true,
  achievementCertificatePossible: false,
});

const locations = (courseId: number) => [
  { id: courseId * 100, locationOption: 'ONLINE', defaultSessionAddress: 'https://zoom.example/j/1', defaultSessionAddressId: null },
  { id: courseId * 100 + 1, locationOption: 'KIEL', defaultSessionAddress: 'Wall 47-51, 24103 Kiel', defaultSessionAddressId: 1 },
];

const session = (id: number, day: string) => ({
  id,
  title: `Termin ${id}`,
  description: '',
  startDateTime: `${day}T17:00:00+00:00`,
  endDateTime: `${day}T18:30:00+00:00`,
  updatedAt: null as string | null,
  locations: [{ courseLocationId: null, address: 'https://zoom.example/j/1', locationAddressId: null }],
});

/**
 * Org 1 runs courses 1 (instructor ins-1, nobody registered) and 2 (instructor ins-2, 3
 * Registrations) in program 10. Org 2 runs course 3 in program 20. oa-1 / oa-2 are the Org Admins of org 1 / org 2.
 */
export const createWorld = (): FakeWorld => ({
  programs: [
    { id: 10, title: 'Wintersemester', organizationId: 1, defaultApplicationEnd: '2027-01-31' },
    { id: 20, title: 'Andere Organisation', organizationId: 2, defaultApplicationEnd: null },
    { id: 30, title: 'Events', organizationId: 1, defaultApplicationEnd: null, type: 'EVENTS' },
  ],
  courses: [
    {
      id: 1,
      programId: 10,
      updatedAt: '2026-11-01T09:00:00+00:00',
      programType: 'COURSES',
      organizationId: 1,
      instructorIds: ['ins-1'],
      registrations: 0,
      fields: fields('Einführung in Machine Learning'),
      courseLocations: locations(1),
      sessions: [session(11, '2027-01-12'), session(12, '2027-01-19')],
    },
    {
      id: 2,
      programId: 10,
      updatedAt: '2026-11-01T09:00:00+00:00',
      programType: 'COURSES',
      organizationId: 1,
      instructorIds: ['ins-2'],
      registrations: 3,
      fields: fields('Deep Learning with PyTorch', 'EN'),
      courseLocations: locations(2),
      sessions: [session(21, '2027-01-14')],
    },
    {
      id: 3,
      programId: 20,
      updatedAt: '2026-11-01T09:00:00+00:00',
      programType: 'COURSES',
      organizationId: 2,
      instructorIds: [],
      registrations: 0,
      fields: fields('Kurs einer anderen Organisation'),
      courseLocations: locations(3),
      sessions: [],
    },
  ],
  allowedRoles: {
    'ins-1': ['instructor', 'user'],
    'ins-2': ['instructor', 'user'],
    'oa-1': ['org_admin', 'user'],
    'oa-2': ['org_admin', 'user'],
    admin: ['admin', 'user'],
    'u-1': ['user'],
  },
  orgAdminOf: { 'oa-1': [1], 'oa-2': [2] },
  mails: [
    mail(1, 'REGISTRATION_CONFIRMED', null, 'Du bist dabei: [Enrollment:CourseId--Course:Name]', '<p>Hallo [User:FirstName],</p><p>[#if:CourseDateTime]Wann: [Course:DateTime][/if:CourseDateTime]</p>'),
    mail(2, 'APPLICATION_CONFIRMED', null, 'Bestätigt', '<p>Hallo [User:FirstName], du bist bestätigt.</p>'),
    mail(3, 'SESSION_REMINDER', null, 'Erinnerung', '<p>Bald geht es los.</p>'),
    mail(4, 'APPLICATION_CONFIRMED', 1, 'Bestätigt: ML', '<p>Hallo [User:FirstName], willkommen im ML-Kurs.</p>'),
  ],
});
