import { isDeclinedByParticipant } from '../invitationDeclined.js';

const event = (sessionUserId, oldStatus = 'INVITED', newStatus = 'CANCELLED') => ({
  op: 'UPDATE',
  session_variables: sessionUserId ? { 'x-hasura-user-id': sessionUserId, 'x-hasura-role': 'user' } : {},
  data: { old: { status: oldStatus, userId: 'AAA' }, new: { status: newStatus, userId: 'aaa' } },
});

describe('isDeclinedByParticipant', () => {
  it('is a decline when the invited person cancelled the invitation themselves', () => {
    expect(isDeclinedByParticipant(event('aaa'))).toBe(true);
  });

  it('is not a decline when an organizer cancelled it or the admin secret did', () => {
    expect(isDeclinedByParticipant(event('organizer-id'))).toBe(false);
    expect(isDeclinedByParticipant(event(null))).toBe(false);
  });

  it('is not a decline for other changes', () => {
    expect(isDeclinedByParticipant(event('aaa', 'CONFIRMED', 'CANCELLED'))).toBe(false);
    expect(isDeclinedByParticipant(event('aaa', 'INVITED', 'EXPIRED'))).toBe(false);
  });
});
