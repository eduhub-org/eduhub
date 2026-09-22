import { print } from 'graphql';
import { MANAGED_COURSE_APPLICATIONS } from '../../../../../queries/course';

// The expire_invitations cron only flips lapsed INVITED enrollments to EXPIRED
// once an hour. The applications table already marks an INVITED enrollment as
// expired once its invitationExpirationDate is before today, so the statistics
// aggregate has to apply the same date rule instead of counting EXPIRED only.
describe('expired invitations aggregate', () => {
  const query = print(MANAGED_COURSE_APPLICATIONS).replace(/\s+/g, ' ');
  const expiredAggregate = query.slice(
    query.indexOf('ExpiredCourseEnrollments:'),
    query.indexOf('AbortedCourseEnrollments:')
  );

  it('accepts an expiration cutoff variable', () => {
    expect(query).toContain('$expirationCutoff: timestamptz!');
  });

  it('counts enrollments already flipped to EXPIRED', () => {
    expect(expiredAggregate).toContain('status: {_eq: EXPIRED}');
  });

  it('counts INVITED enrollments that lapsed before the cutoff', () => {
    expect(expiredAggregate).toContain('status: {_eq: INVITED}');
    expect(expiredAggregate).toContain('invitationExpirationDate: {_lt: $expirationCutoff}');
  });
});
