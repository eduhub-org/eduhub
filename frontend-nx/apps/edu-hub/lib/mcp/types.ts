/** The Hasura roles that may manage courses. `user` and `anonymous` callers are refused. */
export const MANAGING_ROLES = ['admin', 'org_admin', 'instructor'] as const;
export type ManagingRole = (typeof MANAGING_ROLES)[number];

/** A caller whose token Hasura has accepted for `role`. */
export interface Caller {
  userId: string;
  role: string;
}

/**
 * Course texts. A course has one set of texts, written in the course's own `language`
 * (there are no per-language text columns).
 */
export const TEXT_FIELDS = [
  'title',
  'tagline',
  'learningGoals',
  'headingDescriptionField1',
  'contentDescriptionField1',
  'headingDescriptionField2',
  'contentDescriptionField2',
] as const;
export type TextField = (typeof TEXT_FIELDS)[number];

export const SETTING_FIELDS = [
  'maxParticipants',
  'applicationEnd',
  'maxMissedSessions',
  'language',
  'weekDay',
  'startTime',
  'endTime',
  'sessionReminderLeadHours',
  'showAvailablePlaces',
  'attendanceCertificatePossible',
  'achievementCertificatePossible',
] as const;
export type SettingField = (typeof SETTING_FIELDS)[number];

export type CourseFields = Record<TextField | SettingField, string | number | boolean | null>;

/** One Session Location: where a Session takes place for one of the course's location options. */
export interface SessionLocation {
  courseLocationId: number | null;
  address: string | null;
  locationAddressId: number | null;
}

export interface CourseSession {
  id: number;
  title: string;
  description: string | null;
  startDateTime: string;
  endDateTime: string;
  /** Set by a trigger on every update; null for Sessions never updated since the column was added. */
  updatedAt: string | null;
  locations: SessionLocation[];
}

/** A location option of the course (e.g. ONLINE, KIEL) with its default Session address. */
export interface CourseLocationOption {
  id: number;
  locationOption: string | null;
  defaultSessionAddress: string | null;
  defaultSessionAddressId: number | null;
}

export interface CourseSnapshot {
  id: number;
  updatedAt: string;
  programId: number;
  programType: string | null;
  fields: CourseFields;
  sessions: CourseSession[];
  courseLocations: CourseLocationOption[];
  /** Registrations in any state (applied, invited, waitlisted, confirmed, …). */
  registrationCount: number;
}

export interface CourseSummary {
  id: number;
  title: string;
  language: string | null;
  status: string | null;
  programType: string | null;
  registrationCount: number;
}

/** A program the caller may create courses in (Org Admin with the matching capability, or admin). */
export interface ProgramSummary {
  id: number;
  title: string;
  type: string | null;
  organization: string | null;
  defaultApplicationEnd: string | null;
}

export interface NewCourse {
  programId: number;
  fields: Partial<CourseFields>;
  /** Location options (ONLINE, KIEL, …); each gets an empty default Session address. */
  locationOptions: string[];
}

export interface NewSession {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  locations: SessionLocation[];
}

export interface SessionUpdate {
  sessionId: number;
  set: Partial<Pick<CourseSession, 'title' | 'description' | 'startDateTime' | 'endDateTime'>>;
  /** When given, replaces all Session Locations of the Session. */
  locations?: SessionLocation[];
}

export interface SessionChanges {
  create: NewSession[];
  update: SessionUpdate[];
  delete: number[];
}

/**
 * Data access with the caller's own token and role. The Hasura implementation is in
 * `hasuraCourseStore.ts`; tests use an in-memory one.
 */
export interface CourseStore {
  /** Proves the token to Hasura and returns the caller it identifies. */
  verifyCaller(): Promise<Caller>;
  /** Managed courses, newest id first, with ids below `beforeId` when given; at most `limit`. */
  listManagedCourses(caller: Caller, page: { beforeId?: number; limit: number }): Promise<CourseSummary[]>;
  /** The course if the caller manages it (as Hasura's update rules would allow), else null. */
  getManagedCourse(caller: Caller, courseId: number): Promise<CourseSnapshot | null>;
  /** Course columns the caller's role may update. */
  settableCourseColumns(): Promise<Set<string>>;
  /** Saves the columns if the course still has `expectedUpdatedAt`; false when no row matched. */
  updateCourse(courseId: number, expectedUpdatedAt: string, set: Partial<CourseFields>): Promise<boolean>;
  /** Saves Session changes in one transaction. */
  applySessionChanges(courseId: number, changes: SessionChanges): Promise<void>;
  /** Programs the caller may create courses in, as Hasura's Course insert rule allows. */
  /** Newest id first, with ids below `beforeId` when given; at most `limit`. */
  listCreatablePrograms(caller: Caller, page: { beforeId?: number; limit: number }): Promise<ProgramSummary[]>;
  getCreatableProgram(caller: Caller, programId: number): Promise<ProgramSummary | null>;
  /** Course columns the caller's role may set when creating a course. */
  insertableCourseColumns(): Promise<Set<string>>;
  /** The location options that exist (LocationOption values). */
  locationOptions(): Promise<string[]>;
  /** The program's courses with this title, ignoring case (titles are unique per program). */
  coursesTitled(programId: number, title: string): Promise<{ id: number; title: string }[]>;
  /** Creates the course with its location options; returns its id. */
  createCourse(course: NewCourse): Promise<number>;
}
