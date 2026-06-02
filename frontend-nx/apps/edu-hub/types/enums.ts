export enum AuthRoles {
  admin = 'admin',
  instructor = 'instructor',
  user = 'user',
  anonymous = 'anonymous'
}

/** Values from the `ProgramType` lookup table (no longer a Hasura GraphQL enum). */
export enum ProgramType {
  COURSES = 'COURSES',
  DEGREES = 'DEGREES',
  EVENTS = 'EVENTS',
  RENT_A_SCIENTIST = 'RENT_A_SCIENTIST',
}
