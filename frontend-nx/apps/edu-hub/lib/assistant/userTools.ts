import { z } from 'zod';
import { berlinDate } from './prompt';
import { ToolSet, ZodTool, zodToolSet } from './tools';

/**
 * Read tools over the asker's own data (issue #2193). They call Hasura with the asker's own
 * Keycloak token under the `user` role, never the admin secret, so Hasura's row filters apply.
 *
 * On top of that, every query is pinned to the asker's user id from their session, and no tool
 * takes a user id: the schemas are strict, so a model passing one gets a validation error. This
 * matters because the `user` role also includes `user_access_others` (ids of other people's
 * Registrations), which a query without the pin could list.
 */

export class HasuraRequestError extends Error {
  constructor(public readonly code: 'HASURA_ERROR' | 'UNAUTHENTICATED') {
    super(code);
    this.name = 'HasuraRequestError';
  }
}

export interface HasuraCaller {
  url: string;
  /** The asker's Keycloak access token. */
  token: string;
  /** The asker's user id, from their NextAuth session. */
  userId: string;
  fetchImpl?: typeof fetch;
  /** For tests; deadlines compare against today's date in Europe/Berlin. */
  now?: () => Date;
}

/** The role for the asker's own data: every logged-in person has it; org_admin lacks user_access. */
export const OWN_DATA_ROLE = 'user';

export const hasuraAsUser = ({ url, token, fetchImpl = fetch }: HasuraCaller, role: string) =>
  async <T>(query: string, variables: Record<string, unknown>): Promise<T> => {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, 'x-hasura-role': role },
      body: JSON.stringify({ query, variables }),
    });
    const body = await response.json().catch(() => ({}));
    if (body.errors?.length) {
      const code = body.errors[0]?.extensions?.code;
      throw new HasuraRequestError(code === 'invalid-jwt' || code === 'access-denied' ? 'UNAUTHENTICATED' : 'HASURA_ERROR');
    }
    if (!response.ok || !body.data) throw new HasuraRequestError('HASURA_ERROR');
    return body.data as T;
  };

const MY_REGISTRATIONS = `
  query AssistantMyRegistrations($where: CourseEnrollment_bool_exp!) {
    CourseEnrollment(where: $where, order_by: { created_at: desc }, limit: 100) {
      status
      created_at
      invitationExpirationDate
      achievementCertificateURL
      attendanceCertificateURL
      Course { id title language applicationEnd maxMissedSessions waitlistCount Program { title } }
    }
  }
`;

const MY_ATTENDANCE = `
  query AssistantMyAttendance($where: Attendance_bool_exp!) {
    Attendance(where: $where, order_by: { startDateTime: desc }, limit: 200) {
      status
      Session { id title startDateTime Course { id title maxMissedSessions } }
    }
  }
`;

const SEARCH_COURSES = `
  query AssistantSearchCourses($where: Course_bool_exp!) {
    Course(where: $where, order_by: { applicationEnd: desc_nulls_last }, limit: 10) {
      id title tagline language weekDay startTime endTime applicationEnd maxParticipants
      Program { title }
    }
  }
`;

const courseIdArg = z.number().int().positive().optional().describe('Only this course');

const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

export const createUserTools = (caller: HasuraCaller, stripSchemaKeys: string[] = []): ToolSet => {
  const now = caller.now ?? (() => new Date());
  const request = hasuraAsUser(caller, OWN_DATA_ROLE);
  const own = { userId: { _eq: caller.userId } };

  const tools: ZodTool<z.ZodType>[] = [
    {
      name: 'get_my_registrations',
      description:
        'The asker\'s own Registrations: status (e.g. APPLIED, INVITED, CONFIRMED, WAITLIST, REJECTED), the ' +
        'Invitation deadline, the course\'s waitlist size, and whether attendance or achievement certificates ' +
        'are available (download them on the course page).',
      schema: z.object({ courseId: courseIdArg }).strict(),
      run: async ({ courseId }: { courseId?: number }) => {
        const where = courseId ? { _and: [own, { courseId: { _eq: courseId } }] } : own;
        const data = await request<{ CourseEnrollment: any[] }>(MY_REGISTRATIONS, { where });
        return {
          registrations: data.CourseEnrollment.map((e) => ({
            courseId: e.Course?.id ?? null,
            course: e.Course?.title ?? null,
            program: e.Course?.Program?.title ?? null,
            status: e.status,
            registeredAt: e.created_at,
            invitationDeadline: e.invitationExpirationDate ?? null,
            applicationEnd: e.Course?.applicationEnd ?? null,
            maxMissedSessions: e.Course?.maxMissedSessions ?? null,
            peopleOnWaitlist: e.status === 'WAITLIST' ? e.Course?.waitlistCount ?? null : undefined,
            attendanceCertificateAvailable: !!e.attendanceCertificateURL,
            achievementCertificateAvailable: !!e.achievementCertificateURL,
            coursePage: e.Course?.id ? `/course/${e.Course.id}` : null,
          })),
        };
      },
    },
    {
      name: 'get_my_attendance',
      description: 'The asker\'s own attendance per Session (ATTENDED, MISSED, …), newest first.',
      schema: z.object({ courseId: courseIdArg }).strict(),
      run: async ({ courseId }: { courseId?: number }) => {
        const where = courseId ? { _and: [own, { Session: { courseId: { _eq: courseId } } }] } : own;
        const data = await request<{ Attendance: any[] }>(MY_ATTENDANCE, { where });
        return {
          attendance: data.Attendance.map((a) => ({
            status: a.status,
            session: a.Session?.title ?? null,
            sessionStart: a.Session?.startDateTime ?? null,
            courseId: a.Session?.Course?.id ?? null,
            course: a.Session?.Course?.title ?? null,
            maxMissedSessions: a.Session?.Course?.maxMissedSessions ?? null,
          })),
        };
      },
    },
    {
      name: 'search_courses',
      description: 'Search the public course catalogue by words in the title or tagline.',
      schema: z
        .object({
          query: z.string().min(1).max(200).describe('Topic or title words'),
          language: z.enum(['de', 'en']).optional().describe('Course language'),
          openForApplications: z.boolean().optional().describe('Only courses whose application end has not passed'),
        })
        .strict(),
      run: async ({ query, language, openForApplications }: { query: string; language?: 'de' | 'en'; openForApplications?: boolean }) => {
        const words = query.split(/\s+/).filter(Boolean).slice(0, 5);
        const where = {
          _and: [
            { published: { _eq: true } },
            { Program: { published: { _eq: true } } },
            ...words.map((w) => ({
              _or: [{ title: { _ilike: `%${escapeLike(w)}%` } }, { tagline: { _ilike: `%${escapeLike(w)}%` } }],
            })),
            ...(language ? [{ language: { _eq: language.toUpperCase() } }] : []),
            ...(openForApplications ? [{ applicationEnd: { _gte: berlinDate(now()) } }] : []),
          ],
        };
        const data = await request<{ Course: any[] }>(SEARCH_COURSES, { where });
        return {
          courses: data.Course.map((c) => ({
            id: c.id,
            title: c.title,
            tagline: c.tagline,
            language: c.language,
            program: c.Program?.title ?? null,
            weekDay: c.weekDay,
            startTime: c.startTime,
            endTime: c.endTime,
            applicationEnd: c.applicationEnd,
            maxParticipants: c.maxParticipants,
            coursePage: `/course/${c.id}`,
          })),
        };
      },
    },
  ];

  return zodToolSet(tools, stripSchemaKeys);
};
