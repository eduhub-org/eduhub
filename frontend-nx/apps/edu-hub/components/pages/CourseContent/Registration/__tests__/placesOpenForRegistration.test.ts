import { placesOpenForRegistration } from '../types';

describe('placesOpenForRegistration', () => {
  it('has no limit without maxParticipants', () => {
    expect(placesOpenForRegistration({ maxParticipants: null, activeParticipantCount: 5 })).toBeNull();
  });

  it('counts held places', () => {
    expect(placesOpenForRegistration({ maxParticipants: 10, activeParticipantCount: 7 })).toBe(3);
  });

  it('keeps freed places for the waitlist', () => {
    // One participant cancelled (9 -> 8), two people are waiting: still full.
    expect(placesOpenForRegistration({ maxParticipants: 10, activeParticipantCount: 8, waitlistCount: 2 })).toBe(0);
  });

  it('reopens once there are more free places than people waiting', () => {
    expect(placesOpenForRegistration({ maxParticipants: 10, activeParticipantCount: 7, waitlistCount: 2 })).toBe(1);
  });

  it('never goes below zero when organizers overbooked', () => {
    expect(placesOpenForRegistration({ maxParticipants: 10, activeParticipantCount: 12, waitlistCount: 1 })).toBe(0);
  });
});
