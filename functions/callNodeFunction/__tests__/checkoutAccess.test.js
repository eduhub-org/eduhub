import { checkoutAccess, endOfBerlinDay, placesOpenForRegistration } from '../lib/checkoutAccess.js';

describe('endOfBerlinDay', () => {
  it('ends a summer day at 22:00 UTC and a winter day at 23:00 UTC', () => {
    expect(endOfBerlinDay('2026-07-10').toISOString()).toBe('2026-07-10T22:00:00.000Z');
    expect(endOfBerlinDay('2026-12-10').toISOString()).toBe('2026-12-10T23:00:00.000Z');
  });
});

describe('placesOpenForRegistration', () => {
  it('keeps the places the waitlist holds', () => {
    expect(placesOpenForRegistration({ maxParticipants: 10, activeParticipantCount: 8, waitlistCount: 2 })).toBe(0);
    expect(placesOpenForRegistration({ maxParticipants: 10, activeParticipantCount: 7, waitlistCount: 2 })).toBe(1);
    expect(placesOpenForRegistration({ maxParticipants: null })).toBeNull();
  });
});

describe('checkoutAccess', () => {
  const now = new Date('2026-11-02T09:00:00Z');

  it('lets a new registration pay while places are open to newcomers', () => {
    expect(checkoutAccess({ status: 'APPLIED', placesOpen: 1, now })).toEqual({ allowed: true });
    expect(checkoutAccess({ status: 'APPLIED', placesOpen: null, now })).toEqual({ allowed: true });
    expect(checkoutAccess({ status: 'APPLIED', placesOpen: 0, now })).toEqual({ allowed: false, messageKey: 'COURSE_FULL' });
  });

  it('lets an invitation pay until the end of its last day, whatever the places', () => {
    const access = checkoutAccess({ status: 'INVITED', invitationExpirationDate: '2026-11-02', placesOpen: 0, now });
    expect(access.allowed).toBe(true);
    // 2026-11-02 ends at 23:00 UTC (CET), within Stripe's 24 hours.
    expect(access.expiresAt.toISOString()).toBe('2026-11-02T23:00:00.000Z');
  });

  it('caps the checkout at Stripe limits', () => {
    const far = checkoutAccess({ status: 'INVITED', invitationExpirationDate: '2026-11-09', placesOpen: 0, now });
    expect(far.expiresAt.getTime() - now.getTime()).toBe(23 * 60 * 60 * 1000);

    const lastMinutes = new Date('2026-11-02T22:50:00Z');
    const near = checkoutAccess({ status: 'INVITED', invitationExpirationDate: '2026-11-02', placesOpen: 0, now: lastMinutes });
    expect(near.expiresAt.getTime() - lastMinutes.getTime()).toBe(31 * 60 * 1000);
  });

  it('refuses a lapsed invitation', () => {
    expect(checkoutAccess({ status: 'INVITED', invitationExpirationDate: '2026-11-01', placesOpen: 5, now })).toEqual({
      allowed: false,
      messageKey: 'INVITATION_EXPIRED',
    });
  });

  it('does not let anyone on the waitlist or already in pay their way in', () => {
    for (const status of ['WAITLIST', 'CONFIRMED', 'EXPIRED', 'CANCELLED', 'REJECTED']) {
      expect(checkoutAccess({ status, placesOpen: 5, now })).toEqual({ allowed: false, messageKey: 'NOT_PAYABLE' });
    }
  });
});
