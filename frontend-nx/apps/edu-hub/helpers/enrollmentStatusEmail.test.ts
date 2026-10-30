import { enrollmentStatusMailTemplate } from './enrollmentStatusEmail';

// The same cases as functions/callNodeFunction/sendEnrollmentEmail/__tests__:
// the organizer is told the template that function will actually send.
describe('enrollmentStatusMailTemplate', () => {
  it.each([
    ['CONFIRMED', 'DIRECT_CONFIRMATION', 'REGISTRATION_CONFIRMED'],
    ['CONFIRMED', 'DIRECT_WITH_INPUT', 'REGISTRATION_CONFIRMED'],
    ['CONFIRMED', 'DIRECT_CONFIRMATION_AND_PAYMENT', 'REGISTRATION_CONFIRMED'],
    ['CONFIRMED', 'DIRECT_WITH_INPUT_AND_PAYMENT', 'REGISTRATION_CONFIRMED'],
    ['REGISTERED', 'DIRECT_CONFIRMATION', 'REGISTRATION_CONFIRMED'],
    ['CONFIRMED', 'APPROVAL_WITH_INPUT', 'APPLICATION_CONFIRMED'],
    ['APPLIED', 'APPROVAL_WITH_INPUT', 'APPLICATION_RECEIVED'],
    ['INVITED', 'APPROVAL_WITH_INPUT', 'INVITE'],
    ['REJECTED', 'APPROVAL_WITH_INPUT', 'DECLINE'],
    ['WAITLIST', 'DIRECT_CONFIRMATION', 'WAITLIST_NOTICE'],
    ['CANCELLED', 'DIRECT_CONFIRMATION', 'ENROLLMENT_CANCELLED'],
    ['ABORTED', 'DIRECT_CONFIRMATION', 'ENROLLMENT_ABORTED'],
    ['EXPIRED', 'APPROVAL_WITH_INPUT', 'INVITATION_EXPIRED'],
  ])('%s on %s sends %s', (newStatus, registrationType, template) => {
    expect(enrollmentStatusMailTemplate({ oldStatus: 'APPLIED', newStatus, registrationType })).toBe(template);
  });

  it('uses the paid variants after payment', () => {
    expect(
      enrollmentStatusMailTemplate({
        newStatus: 'CONFIRMED',
        registrationType: 'DIRECT_CONFIRMATION_AND_PAYMENT',
        isPaid: true,
      })
    ).toBe('REGISTRATION_CONFIRMED_PAID');
  });

  it('tells someone moved up from the waitlist that they have the place', () => {
    expect(
      enrollmentStatusMailTemplate({ oldStatus: 'WAITLIST', newStatus: 'CONFIRMED', registrationType: 'DIRECT_CONFIRMATION' })
    ).toBe('WAITLIST_CONFIRMED');
  });

  it('invites someone from the waitlist with the promotion email', () => {
    expect(
      enrollmentStatusMailTemplate({ oldStatus: 'WAITLIST', newStatus: 'INVITED', registrationType: 'APPROVAL_WITH_INPUT' })
    ).toBe('WAITLIST_PROMOTED');
  });

  it('asks for payment when inviting on a paid course', () => {
    expect(
      enrollmentStatusMailTemplate({
        oldStatus: 'WAITLIST',
        newStatus: 'INVITED',
        registrationType: 'DIRECT_WITH_INPUT_AND_PAYMENT',
      })
    ).toBe('WAITLIST_PROMOTED_PAYMENT');
  });

  it('sends the invitation again when it is renewed with a new deadline', () => {
    expect(enrollmentStatusMailTemplate({ oldStatus: 'INVITED', newStatus: 'INVITED' })).toBe('INVITE');
  });

  it('sends nothing on completion', () => {
    expect(enrollmentStatusMailTemplate({ oldStatus: 'CONFIRMED', newStatus: 'COMPLETED' })).toBeNull();
  });
});
