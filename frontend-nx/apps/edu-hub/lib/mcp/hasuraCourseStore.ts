import { OperationError } from './errors';
import {
  Caller,
  CourseFields,
  CourseSnapshot,
  CourseStore,
  CourseSummary,
  MANAGING_ROLES,
  SessionChanges,
  SessionLocation,
  SETTING_FIELDS,
  TEXT_FIELDS,
} from './types';

const HASURA_CLAIMS = 'https://hasura.io/jwt/claims';

interface HasuraClaims {
  'x-hasura-user-id'?: string;
  'x-hasura-allowed-roles'?: string[];
}

/** Reads the token's Hasura claims WITHOUT verifying it - use only after Hasura has accepted it. */
const unverifiedClaims = (token: string): HasuraClaims => {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return payload?.[HASURA_CLAIMS] ?? {};
  } catch {
    return {};
  }
};

/**
 * The role to act as: the requested one, or else the caller's most capable managing role.
 * Hasura rejects a role the token does not allow, so this never grants anything by itself.
 */
export const pickRole = (token: string, requested?: string | null): string => {
  if (requested) return requested;
  const allowed = unverifiedClaims(token)['x-hasura-allowed-roles'] ?? [];
  return MANAGING_ROLES.find((r) => allowed.includes(r)) ?? 'user';
};

/**
 * The courses `userId` may manage under `role`, mirroring the row filters of Hasura's
 * Course/Session update permissions (backend/metadata/.../public_Course.yaml, public_Session.yaml).
 * It only decides what is offered and checked up front; Hasura enforces the real rules on write.
 */
export const managedCourseWhere = (role: string, userId: string): Record<string, unknown> => {
  if (role === 'admin') return {};
  if (role === 'instructor') return { CourseInstructors: { User: { id: { _eq: userId } } } };
  if (role === 'org_admin') {
    const admin = (capability: string) => ({
      Organization: { OrganizationAdmins: { userId: { _eq: userId }, [capability]: { _eq: true } } },
    });
    return {
      Program: {
        _or: [
          { type: { _eq: 'EVENTS' }, ...admin('canManageEvents') },
          { type: { _eq: 'COURSES' }, ...admin('canManageCourses') },
          { type: { _eq: 'DEGREES' }, ...admin('canManageDegrees') },
          admin('canManageSettings'),
        ],
      },
    };
  }
  // Any other role manages nothing.
  return { id: { _is_null: true } };
};

const COURSE_FIELDS = [...TEXT_FIELDS, ...SETTING_FIELDS].join('\n');

const COURSE_QUERY = `
  query McpManagedCourse($where: Course_bool_exp!) {
    Course(where: $where, limit: 1) {
      id
      updated_at
      ${COURSE_FIELDS}
      Program { type }
      CourseEnrollments_aggregate { aggregate { count } }
      CourseLocations(order_by: { id: asc }) { id locationOption defaultSessionAddress defaultSessionAddressId }
      Sessions(order_by: { id: asc }) {
        id title description startDateTime endDateTime
        SessionAddresses(order_by: { id: asc }) { courseLocationId address locationAddressId }
      }
    }
  }
`;

const LIST_QUERY = `
  query McpManagedCourses($where: Course_bool_exp!) {
    Course(where: $where, order_by: { id: desc }, limit: 200) {
      id title language status
      Program { type }
      CourseEnrollments_aggregate { aggregate { count } }
    }
  }
`;

interface Options {
  /** Hasura GraphQL endpoint, e.g. http://localhost:8080/v1/graphql */
  url: string;
  /** The caller's Keycloak access token. Never the admin secret. */
  token: string;
  role: string;
  fetchImpl?: typeof fetch;
}

/** A CourseStore that talks to Hasura as the caller, with their token and role. */
export const createHasuraCourseStore = ({ url, token, role, fetchImpl = fetch }: Options): CourseStore => {
  const request = async <T>(query: string, variables: Record<string, unknown> = {}): Promise<T> => {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, 'x-hasura-role': role },
      body: JSON.stringify({ query, variables }),
    });
    const body = await response.json().catch(() => ({}));
    if (body.errors?.length) {
      const [first] = body.errors;
      const code = first.extensions?.code;
      if (code === 'invalid-jwt' || code === 'jwt-invalid-claims' || code === 'access-denied') {
        throw new OperationError('UNAUTHENTICATED', `Hasura refused the token or role "${role}": ${first.message}`);
      }
      throw new OperationError('HASURA_ERROR', first.message);
    }
    if (!response.ok || !body.data) throw new OperationError('HASURA_ERROR', `Hasura answered ${response.status}.`);
    return body.data as T;
  };

  let verified: Caller | null = null;

  return {
    async verifyCaller() {
      if (verified) return verified;
      // Hasura verifies the token's signature and that it allows `role` on every request; only
      // after it accepted this exact token are its claims trusted.
      await request('query McpWhoAmI { __typename }');
      const userId = unverifiedClaims(token)['x-hasura-user-id'];
      if (!userId) throw new OperationError('UNAUTHENTICATED', 'The token carries no Hasura user id.');
      verified = { userId, role };
      return verified;
    },

    async listManagedCourses(caller) {
      const data = await request<{ Course: any[] }>(LIST_QUERY, { where: managedCourseWhere(caller.role, caller.userId) });
      return data.Course.map(
        (c): CourseSummary => ({
          id: c.id,
          title: c.title,
          language: c.language,
          status: c.status,
          programType: c.Program?.type ?? null,
          registrationCount: c.CourseEnrollments_aggregate.aggregate.count,
        })
      );
    },

    async getManagedCourse(caller, courseId) {
      const where = { _and: [{ id: { _eq: courseId } }, managedCourseWhere(caller.role, caller.userId)] };
      const data = await request<{ Course: any[] }>(COURSE_QUERY, { where });
      const c = data.Course[0];
      if (!c) return null;
      const fields = Object.fromEntries(
        [...TEXT_FIELDS, ...SETTING_FIELDS].map((f) => [f, c[f] ?? null])
      ) as CourseFields;
      return {
        id: c.id,
        updatedAt: c.updated_at,
        programType: c.Program?.type ?? null,
        fields,
        registrationCount: c.CourseEnrollments_aggregate.aggregate.count,
        courseLocations: c.CourseLocations,
        sessions: c.Sessions.map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          startDateTime: s.startDateTime,
          endDateTime: s.endDateTime,
          locations: s.SessionAddresses,
        })),
      } satisfies CourseSnapshot;
    },

    async settableCourseColumns() {
      const data = await request<{ __type: { inputFields: { name: string }[] } | null }>(
        'query McpCourseSetInput { __type(name: "Course_set_input") { inputFields { name } } }'
      );
      return new Set((data.__type?.inputFields ?? []).map((f) => f.name));
    },

    async updateCourse(courseId, expectedUpdatedAt, set) {
      const data = await request<{ update_Course: { affected_rows: number } }>(
        `mutation McpUpdateCourse($id: Int!, $updatedAt: timestamptz!, $set: Course_set_input!) {
          update_Course(where: { id: { _eq: $id }, updated_at: { _eq: $updatedAt } }, _set: $set) { affected_rows }
        }`,
        { id: courseId, updatedAt: expectedUpdatedAt, set }
      );
      return data.update_Course.affected_rows === 1;
    },

    async applySessionChanges(courseId, changes) {
      const { document, variables } = buildSessionMutation(courseId, changes);
      const data = await request<Record<string, unknown>>(document, variables);
      // Hasura runs all fields of one mutation in a single transaction, but a row its permission
      // filter hides is skipped (null / 0 rows) rather than raising, so report any such skip.
      const skipped = Object.entries(data)
        .filter(([alias, value]) => /^(u|d)\d+$/.test(alias) && value === null)
        .map(([alias]) => alias);
      if (skipped.length) {
        throw new OperationError(
          'HASURA_ERROR',
          `Some Sessions could not be changed with your role (${skipped.join(', ')}); the rest was saved.`
        );
      }
    },
  };
};

const addressRows = (locations: SessionLocation[], sessionId?: number) =>
  locations.map((l) => ({
    courseLocationId: l.courseLocationId,
    address: l.address,
    locationAddressId: l.locationAddressId,
    ...(sessionId !== undefined && { sessionId }),
  }));

/** One mutation document for all Session changes, so Hasura saves them in one transaction. */
export const buildSessionMutation = (courseId: number, changes: SessionChanges) => {
  const params: string[] = [];
  const fields: string[] = [];
  const variables: Record<string, unknown> = {};

  changes.delete.forEach((id, i) => {
    params.push(`$d${i}: Int!`);
    variables[`d${i}`] = id;
    fields.push(`d${i}: delete_Session_by_pk(id: $d${i}) { id }`);
  });
  changes.update.forEach((u, i) => {
    params.push(`$u${i}id: Int!`);
    variables[`u${i}id`] = u.sessionId;
    if (Object.keys(u.set).length) {
      params.push(`$u${i}set: Session_set_input!`);
      variables[`u${i}set`] = u.set;
      fields.push(`u${i}: update_Session_by_pk(pk_columns: { id: $u${i}id }, _set: $u${i}set) { id }`);
    }
    if (u.locations) {
      params.push(`$u${i}loc: [SessionAddress_insert_input!]!`);
      variables[`u${i}loc`] = addressRows(u.locations, u.sessionId);
      fields.push(`u${i}clear: delete_SessionAddress(where: { sessionId: { _eq: $u${i}id } }) { affected_rows }`);
      fields.push(`u${i}add: insert_SessionAddress(objects: $u${i}loc) { affected_rows }`);
    }
  });
  changes.create.forEach((s, i) => {
    params.push(`$c${i}: Session_insert_input!`);
    variables[`c${i}`] = {
      courseId,
      title: s.title,
      description: s.description,
      startDateTime: s.startDateTime,
      endDateTime: s.endDateTime,
      SessionAddresses: { data: addressRows(s.locations) },
    };
    fields.push(`c${i}: insert_Session_one(object: $c${i}) { id }`);
  });

  const document = `mutation McpApplySessions${params.length ? `(${params.join(', ')})` : ''} {\n  ${fields.join('\n  ')}\n}`;
  return { document, variables };
};
