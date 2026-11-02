// Who may open a Stripe checkout for a course enrollment, and until when.
//
// Two ways lead to paying for a place:
// - a new registration (APPLIED), which may only take a place that is open to
//   newcomers: places the waitlist holds are not (see course_waitlist_count);
// - an invitation (INVITED), e.g. someone moved up from the waitlist, whose
//   place is already held. It is accepted by paying before its deadline, so
//   the checkout ends with the deadline.
// Anyone else - above all someone still on the waitlist - cannot pay their
// way in.

const TIME_ZONE = 'Europe/Berlin';
// Stripe accepts a checkout expiry between 30 minutes and 24 hours ahead.
export const MIN_SESSION_MS = 31 * 60 * 1000;
const MAX_SESSION_MS = 23 * 60 * 60 * 1000;

const hourIn = (date, timeZone) =>
  Number(new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(date));

/**
 * The end of a calendar day ("yyyy-MM-dd") in Europe/Berlin: midnight at the
 * start of the following day. An invitation's last day is still open until
 * then, the same boundary as expire_invitations.
 */
export const endOfBerlinDay = (day) => {
  const [year, month, date] = String(day).slice(0, 10).split('-').map(Number);
  // Berlin is one or two hours ahead of UTC; take the offset that lands on midnight.
  for (const offsetHours of [1, 2]) {
    const candidate = new Date(Date.UTC(year, month - 1, date + 1, -offsetHours));
    if (hourIn(candidate, TIME_ZONE) === 0) return candidate;
  }
  return new Date(Date.UTC(year, month - 1, date + 1));
};

/**
 * @param {Object} params
 * @param {string} params.status - The enrollment's status
 * @param {string|null} params.invitationExpirationDate - Last day of an invitation ("yyyy-MM-dd")
 * @param {number|null} params.placesOpen - Places open to new registrations, null without a limit
 * @param {Date} [params.now]
 * @returns {{ allowed: boolean, messageKey?: string, expiresAt?: Date }}
 */
export const checkoutAccess = ({ status, invitationExpirationDate, placesOpen, now = new Date() }) => {
  if (status === 'APPLIED') {
    return placesOpen === 0 ? { allowed: false, messageKey: 'COURSE_FULL' } : { allowed: true };
  }
  if (status === 'INVITED') {
    if (!invitationExpirationDate) return { allowed: true };
    const deadline = endOfBerlinDay(invitationExpirationDate);
    if (now >= deadline) return { allowed: false, messageKey: 'INVITATION_EXPIRED' };
    const expiresAtMs = Math.min(
      Math.max(deadline.getTime(), now.getTime() + MIN_SESSION_MS),
      now.getTime() + MAX_SESSION_MS
    );
    return { allowed: true, expiresAt: new Date(expiresAtMs) };
  }
  return { allowed: false, messageKey: 'NOT_PAYABLE' };
};

/** Places open to new registrations: held ones and the waitlist's are not. */
export const placesOpenForRegistration = (course) => {
  if (course?.maxParticipants == null) return null;
  const taken = Number(course.activeParticipantCount ?? 0) + Number(course.waitlistCount ?? 0);
  return Math.max(0, course.maxParticipants - taken);
};
