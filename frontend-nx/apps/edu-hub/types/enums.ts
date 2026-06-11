export enum AuthRoles {
  admin = 'admin',
  org_admin = 'org_admin',
  instructor = 'instructor',
  user = 'user',
  anonymous = 'anonymous'
}

/** Values from the `ProgramType` lookup table (no longer a Hasura GraphQL enum). */
export enum ProgramType {
  COURSES = 'COURSES',
  DEGREES = 'DEGREES',
  EVENTS = 'EVENTS',
}
