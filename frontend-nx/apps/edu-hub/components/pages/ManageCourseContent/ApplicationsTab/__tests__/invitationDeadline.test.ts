import { defaultInvitationDeadline } from '../invitationDeadline';

describe('defaultInvitationDeadline', () => {
  const today = new Date('2026-11-02T10:00:00Z');

  it('is a week from today', () => {
    expect(defaultInvitationDeadline(null, today).toISOString()).toBe('2026-11-09T10:00:00.000Z');
    expect(defaultInvitationDeadline('2026-12-01T17:00:00Z', today).toISOString()).toBe('2026-11-09T10:00:00.000Z');
  });

  it('is never after the first day of the course', () => {
    expect(defaultInvitationDeadline('2026-11-05T17:00:00Z', today).toISOString()).toBe('2026-11-05T17:00:00.000Z');
  });

  it('is today once the course has started', () => {
    expect(defaultInvitationDeadline('2026-10-20T17:00:00Z', today).toISOString()).toBe(today.toISOString());
  });
});
