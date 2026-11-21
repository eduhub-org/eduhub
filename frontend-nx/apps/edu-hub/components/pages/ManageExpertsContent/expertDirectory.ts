import { ExpertsList_User } from '../../../queries/__generated__/ExpertsList';
import { ProgramType } from '../../../types/enums';

/** Where a search word was found; a translation key under `manageExperts.match_field`. */
export type MatchField = 'name' | 'email' | 'organization' | 'title' | 'tagline' | 'description' | 'course_title';

/** What an Expert Role is about, as the semantic search identifies it (ADR 0004). */
export type ExpertRoleSourceType = 'COURSE' | 'SESSION' | 'PROJECT' | 'ACHIEVEMENT_OPTION';

export type ExpertRoleKind = 'instructor' | 'organizer' | 'speaker' | 'project_mentor' | 'achievement_mentor';

/** One Expert Role (CONTEXT.md): a course led, a session spoken at, a project or option mentored. */
export interface ExpertRole {
  key: string;
  kind: ExpertRoleKind;
  source: { type: ExpertRoleSourceType; id: number };
  title: string;
  /** Program short title or, for speakers, the course the session belongs to. */
  context: string;
  date: Date | null;
  /** Organizations whose programs the role belongs to (via its course or the course it is used in). */
  organizationIds: number[];
  texts: { field: MatchField; value: string | null | undefined }[];
}

/**
 * The fields the directory search looks in, as Hasura paths from User. Keep in sync with
 * personTexts and expertRoles, which explain a hit from the same fields.
 */
export const EXPERT_SEARCH_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'organizationName',
  'Organization.name',
  'CourseInstructors.Course.title',
  'CourseInstructors.Course.tagline',
  'CourseInstructors.Course.contentDescriptionField1',
  'CourseInstructors.Course.contentDescriptionField2',
  'CourseInstructors.Course.headingDescriptionField1',
  'CourseInstructors.Course.headingDescriptionField2',
  'SessionSpeakers.Session.title',
  'SessionSpeakers.Session.description',
  'SessionSpeakers.Session.Course.title',
  'ProjectMentors.Project.title',
  'ProjectMentors.Project.tagline',
  'ProjectMentors.Project.description',
  'AchievementOptionMentors.AchievementOption.title',
  'AchievementOptionMentors.AchievementOption.description',
];

// The Apollo cache already turns some date fields into Date objects (config/apollo.ts typePolicies,
// e.g. Program.lectureStart, Session.startDateTime); the others stay ISO strings.
const toDate = (value: unknown): Date | null => {
  if (!(value instanceof Date) && (typeof value !== 'string' || !value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const ids = (values: (number | null | undefined)[]): number[] =>
  Array.from(new Set(values.filter((value): value is number => typeof value === 'number')));

export const organizationOf = (expert: ExpertsList_User): string =>
  expert.Organization?.name || expert.organizationName || '';

const personTexts = (expert: ExpertsList_User): { field: MatchField; value: string | null | undefined }[] => [
  { field: 'name', value: [expert.firstName, expert.lastName].filter(Boolean).join(' ') },
  { field: 'email', value: expert.email },
  { field: 'organization', value: organizationOf(expert) },
];

/** All Expert Roles of a person, newest first; roles without a date come last. */
export const expertRoles = (expert: ExpertsList_User): ExpertRole[] => {
  const roles: ExpertRole[] = [];

  expert.CourseInstructors?.forEach(({ id, Course }) => {
    if (!Course) return;
    roles.push({
      key: `instructor-${id}`,
      kind: Course.Program?.type === ProgramType.EVENTS ? 'organizer' : 'instructor',
      source: { type: 'COURSE', id: Course.id },
      title: Course.title,
      context: Course.Program?.shortTitle ?? '',
      date: toDate(Course.Program?.lectureStart),
      organizationIds: ids([Course.Program?.organizationId]),
      texts: [
        { field: 'title', value: Course.title },
        { field: 'tagline', value: Course.tagline },
        { field: 'description', value: Course.headingDescriptionField1 },
        { field: 'description', value: Course.contentDescriptionField1 },
        { field: 'description', value: Course.headingDescriptionField2 },
        { field: 'description', value: Course.contentDescriptionField2 },
      ],
    });
  });

  expert.SessionSpeakers?.forEach(({ id, Session }) => {
    if (!Session) return;
    roles.push({
      key: `speaker-${id}`,
      kind: 'speaker',
      source: { type: 'SESSION', id: Session.id },
      title: Session.title,
      context: Session.Course?.title ?? '',
      date: toDate(Session.startDateTime),
      organizationIds: ids([Session.Course?.Program?.organizationId]),
      texts: [
        { field: 'title', value: Session.title },
        { field: 'description', value: Session.description },
        { field: 'course_title', value: Session.Course?.title },
      ],
    });
  });

  expert.ProjectMentors?.forEach(({ id, Project }) => {
    if (!Project) return;
    roles.push({
      key: `project-${id}`,
      kind: 'project_mentor',
      source: { type: 'PROJECT', id: Project.id },
      title: Project.title,
      context: '',
      date: toDate(Project.created_at),
      organizationIds: ids(Project.ProjectCourses?.map((link) => link.Course?.Program?.organizationId) ?? []),
      texts: [
        { field: 'title', value: Project.title },
        { field: 'tagline', value: Project.tagline },
        { field: 'description', value: Project.description },
      ],
    });
  });

  expert.AchievementOptionMentors?.forEach(({ id, AchievementOption }) => {
    if (!AchievementOption) return;
    roles.push({
      key: `achievement-${id}`,
      kind: 'achievement_mentor',
      source: { type: 'ACHIEVEMENT_OPTION', id: AchievementOption.id },
      title: AchievementOption.title,
      context: '',
      date: toDate(AchievementOption.created_at),
      organizationIds: ids(
        AchievementOption.AchievementOptionCourses?.map((link) => link.Course?.Program?.organizationId) ?? []
      ),
      texts: [
        { field: 'title', value: AchievementOption.title },
        { field: 'description', value: AchievementOption.description },
      ],
    });
  });

  return roles.sort((a, b) => (b.date?.getTime() ?? -Infinity) - (a.date?.getTime() ?? -Infinity));
};

/**
 * The organizations an org admin may write an Expert Note for: those they manage that the expert
 * worked with (the insert permission checks the same).
 */
export const noteOrganizationsFor = <T extends { id: number }>(managed: T[], roles: ExpertRole[]): T[] => {
  const worked = new Set(roles.flatMap((role) => role.organizationIds));
  return managed.filter((organization) => worked.has(organization.id));
};

/** Last Active (CONTEXT.md), from the roles the viewer can see. */
export const lastActive = (roles: ExpertRole[]): Date | null =>
  roles.reduce<Date | null>((latest, role) => (role.date && (!latest || role.date > latest) ? role.date : latest), null);

/** The words of a search, as the search condition splits them. */
export const searchWords = (search: string): string[] =>
  search
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());

/** Course and session texts may hold Markdown or HTML; matches are explained on plain text. */
const plainText = (value: string): string =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[*_#`>[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export interface TextSegment {
  text: string;
  hit: boolean;
}

/** Splits text into segments, marking every occurrence of any of the words. */
export const highlight = (text: string, words: string[]): TextSegment[] => {
  if (!words.length || !text) return [{ text, hit: false }];
  const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  return text
    .split(pattern)
    .filter((part) => part !== '')
    .map((part) => ({ text: part, hit: words.includes(part.toLowerCase()) }));
};

const SNIPPET_CONTEXT = 40;

/** An excerpt around the first hit: `context` characters before it and twice that after it. */
export const snippet = (value: string, words: string[], context = SNIPPET_CONTEXT): string => {
  const text = plainText(value);
  const lower = text.toLowerCase();
  const first = Math.min(...words.map((word) => lower.indexOf(word)).filter((index) => index >= 0));
  if (!Number.isFinite(first) || text.length <= 3 * context + 20) return text;
  const start = Math.max(0, first - context);
  const end = Math.min(text.length, first + context * 2);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
};

export interface ExpertMatch {
  /** The role the hit is in, or null for the person's own fields. */
  role: ExpertRole | null;
  field: MatchField;
  snippet: string;
}

/**
 * Why a row matched the search: every field holding one of the search words (the same
 * case-insensitive "contains" the search condition uses). Person fields come first, then roles,
 * newest first; one entry per role and field.
 */
export const findMatches = (
  expert: ExpertsList_User,
  roles: ExpertRole[],
  search: string,
  snippetContext = SNIPPET_CONTEXT
): ExpertMatch[] => {
  const words = searchWords(search);
  if (!words.length) return [];

  const matches: ExpertMatch[] = [];
  const seen = new Set<string>();
  const check = (role: ExpertRole | null, field: MatchField, value: string | null | undefined) => {
    if (!value) return;
    const lower = plainText(value).toLowerCase();
    const found = words.filter((word) => lower.includes(word));
    const id = `${role?.key ?? 'person'}:${field}`;
    if (!found.length || seen.has(id)) return;
    seen.add(id);
    matches.push({ role, field, snippet: snippet(value, found, snippetContext) });
  };

  personTexts(expert).forEach(({ field, value }) => check(null, field, value));
  roles.forEach((role) => role.texts.forEach(({ field, value }) => check(role, field, value)));
  return matches;
};

/**
 * Whether the keyword search lists this person: every word is in one of their searched fields.
 * It mirrors the server filter (EXPERT_SEARCH_FIELDS, case-insensitive "contains" on the raw
 * column), so it reads both organization columns and the unformatted texts, unlike the match
 * explanation.
 */
export const matchesAllWords = (expert: ExpertsList_User, roles: ExpertRole[], search: string): boolean => {
  const words = searchWords(search);
  if (!words.length) return false;
  const texts = [
    expert.firstName,
    expert.lastName,
    expert.email,
    expert.organizationName,
    expert.Organization?.name,
    ...roles.flatMap((role) => role.texts.map(({ value }) => value)),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());
  return words.every((word) => texts.some((text) => text.includes(word)));
};

export const linkedInSearchUrl = (expert: ExpertsList_User): string => {
  const keywords = [expert.firstName, expert.lastName, organizationOf(expert)].filter(Boolean).join(' ');
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
};

export type ProfileKind = 'linkedin' | 'xing' | 'other';

/** The person's own profile link, made absolute; null when it is empty or not a web address. */
export const profileUrl = (externalProfile: string | null | undefined): string | null => {
  const value = externalProfile?.trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes('.') ? url.toString() : null;
  } catch {
    return null;
  }
};

export const profileKind = (url: string): ProfileKind => {
  const host = new URL(url).hostname.toLowerCase();
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) return 'linkedin';
  if (host === 'xing.com' || host.endsWith('.xing.com')) return 'xing';
  return 'other';
};

/** BCC so recipients do not see each other; null when nobody can be written to. */
export const mailtoBcc = (experts: Pick<ExpertsList_User, 'email' | 'doNotContact'>[]): string | null => {
  const emails = experts.filter((expert) => !expert.doNotContact && expert.email).map((expert) => expert.email);
  return emails.length ? `mailto:?bcc=${emails.map(encodeURIComponent).join(',')}` : null;
};

/** CSV rows of the visible columns; people marked Do Not Contact are left out. */
export const expertCsvRows = (experts: ExpertsList_User[], header: string[]): string[][] => [
  header,
  ...experts
    .filter((expert) => !expert.doNotContact)
    .map((expert) => {
      const active = lastActive(expertRoles(expert));
      return [
        expert.firstName ?? '',
        expert.lastName ?? '',
        organizationOf(expert),
        expert.email ?? '',
        active ? String(active.getFullYear()) : '',
      ];
    }),
];

export interface SourceMatch {
  sourceType: string;
  sourceId: number;
  similarity: number;
}

const sourceKey = (type: string, id: number) => `${type}:${id}`;

/** A Hasura condition on User for "has a role in one of these sources". */
export const sourcesCondition = (matches: SourceMatch[]) => {
  const ids = (type: ExpertRoleSourceType) =>
    matches.filter((match) => match.sourceType === type).map((match) => match.sourceId);
  return {
    _or: [
      { CourseInstructors: { courseId: { _in: ids('COURSE') } } },
      { SessionSpeakers: { sessionId: { _in: ids('SESSION') } } },
      { ProjectMentors: { projectId: { _in: ids('PROJECT') } } },
      { AchievementOptionMentors: { achievementOptionId: { _in: ids('ACHIEVEMENT_OPTION') } } },
    ],
  };
};

export interface SimilarRole {
  role: ExpertRole;
  similarity: number;
}

/** The roles of a person the semantic search found, closest in meaning first. */
export const similarRoles = (roles: ExpertRole[], matches: SourceMatch[]): SimilarRole[] => {
  const similarity = new Map(matches.map((match) => [sourceKey(match.sourceType, match.sourceId), match.similarity]));
  return roles
    .flatMap((role) => {
      const value = similarity.get(sourceKey(role.source.type, role.source.id));
      return value === undefined ? [] : [{ role, similarity: value }];
    })
    .sort((a, b) => b.similarity - a.similarity);
};

/** The beginning of a text as plain text, cut at a word near `length` characters. */
export const leadExcerpt = (value: string | null | undefined, length = 300): string => {
  const text = plainText(value ?? '');
  if (text.length <= length) return text;
  const cut = text.lastIndexOf(' ', length);
  return `${text.slice(0, cut > length / 2 ? cut : length)}…`;
};

/** One row of the search results: why the person is in it and how relevant they are. */
export interface RankedExpert {
  expert: ExpertsList_User;
  roles: ExpertRole[];
  /** Every search word is in one of their searched fields (the keyword search lists them). */
  keywordHit: boolean;
  /** Roles close in meaning to the search, best first; empty when only the words matched. */
  similar: SimilarRole[];
}

// Reciprocal rank fusion: each list adds 1 / (K + rank). K = 60 is the usual choice; it keeps
// a person found by both searches above one found by only one, without tuning weights to the
// different scales of keyword and cosine scores.
const RRF_K = 60;

// How telling a keyword hit is, by the field it is in: a title says what the role is about, a
// description may only mention the word.
const FIELD_WEIGHT: Record<MatchField, number> = {
  name: 0,
  email: 0,
  organization: 1,
  title: 3,
  tagline: 2,
  course_title: 1,
  description: 1,
};

const keywordStrength = (expert: ExpertsList_User, roles: ExpertRole[], search: string): number =>
  findMatches(expert, roles, search).reduce((sum, match) => sum + FIELD_WEIGHT[match.field], 0);

/** Every search word is in the person's name or email: someone searched for them by name. */
const isPersonHit = (expert: ExpertsList_User, search: string): boolean => {
  const words = searchWords(search);
  const text = [expert.firstName, expert.lastName, expert.email].filter(Boolean).join(' ').toLowerCase();
  return words.length > 0 && words.every((word) => text.includes(word));
};

/**
 * One list of the people the keyword and the semantic search found (ADR 0004): someone searched
 * by name or email comes first; everyone else is ordered by reciprocal rank fusion of their rank
 * in both searches, then by Last Active.
 */
export const rankExperts = (
  keywordExperts: ExpertsList_User[],
  similarExperts: ExpertsList_User[],
  matches: SourceMatch[],
  search: string
): RankedExpert[] => {
  const people = new Map<string, ExpertsList_User>();
  [...keywordExperts, ...similarExperts].forEach((expert) => people.set(expert.id, expert));

  const candidates = Array.from(people.values()).flatMap((expert) => {
    const roles = expertRoles(expert);
    const keywordHit = matchesAllWords(expert, roles, search);
    const similar = similarRoles(roles, matches);
    if (!keywordHit && !similar.length) return [];
    return [
      {
        ranked: { expert, roles, keywordHit, similar },
        personHit: keywordHit && isPersonHit(expert, search),
        strength: keywordHit ? keywordStrength(expert, roles, search) : 0,
        active: lastActive(roles)?.getTime() ?? 0,
      },
    ];
  });

  const rankBy = (subset: typeof candidates, value: (candidate: (typeof candidates)[number]) => number) =>
    new Map(
      [...subset]
        .sort((a, b) => value(b) - value(a) || b.active - a.active)
        .map((candidate, index) => [candidate.ranked.expert.id, index + 1])
    );
  const keywordRank = rankBy(
    candidates.filter((candidate) => candidate.ranked.keywordHit),
    (candidate) => candidate.strength
  );
  const semanticRank = rankBy(
    candidates.filter((candidate) => candidate.ranked.similar.length > 0),
    (candidate) => candidate.ranked.similar[0].similarity
  );
  const fused = (id: string) =>
    [keywordRank.get(id), semanticRank.get(id)].reduce<number>(
      (sum, rank) => (rank === undefined ? sum : sum + 1 / (RRF_K + rank)),
      0
    );

  return candidates
    .map((candidate) => ({ ...candidate, score: fused(candidate.ranked.expert.id) }))
    .sort((a, b) => Number(b.personHit) - Number(a.personHit) || b.score - a.score || b.active - a.active)
    .map((candidate) => candidate.ranked);
};
