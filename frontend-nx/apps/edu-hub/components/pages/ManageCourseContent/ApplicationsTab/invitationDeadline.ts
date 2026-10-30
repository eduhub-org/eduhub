/**
 * The default invitation deadline: a week from today, but never after the first day of the
 * course, so the place is settled before it starts.
 */
export const defaultInvitationDeadline = (firstSessionStart: string | null | undefined, today = new Date()) => {
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + 7);
  if (firstSessionStart) {
    const firstDay = new Date(firstSessionStart);
    if (firstDay < deadline) return firstDay > today ? firstDay : today;
  }
  return deadline;
};
