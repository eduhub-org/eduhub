import { AttendanceStatus_enum } from '../../../../__generated__/globalTypes';
import { AttendanceDay } from '../../../../helpers/attendanceDays';
import { AttendanceLike, collapseAttendancesBySession } from '../../../../helpers/courseParticipationAttendance';
import { ParsedAttendanceCsv } from '../ParticipantExport/participantExport';

export interface ImportParticipant {
  userId: string;
  email: string;
  Attendances: AttendanceLike[];
}

export interface AttendanceImportPlan {
  /** One Attendance row per session whose effective status changes. */
  changes: { userId: string; sessionId: number; status: AttendanceStatus_enum }[];
  matchedCount: number;
  /** Changed (participant, day) pairs by their new status. */
  attendedDays: number;
  missedDays: number;
  /** Day keys that are imported, ascending. */
  importedDayKeys: string[];
  unknownEmails: string[];
  /** Day columns for days without a session, or for days still ahead. */
  ignoredColumns: string[];
}

/**
 * Turns a parsed upload into the attendance rows to insert. A day is written
 * like a click on its dot: every session of the day gets the day's status.
 * Days that have not started yet are skipped, since an empty cell means missed.
 */
export function planAttendanceImport({
  parsed,
  days,
  participants,
  now = new Date(),
}: {
  parsed: ParsedAttendanceCsv;
  days: readonly AttendanceDay[];
  participants: readonly ImportParticipant[];
  now?: Date;
}): AttendanceImportPlan {
  const daysByKey = new Map(days.map((day) => [day.dayKey, day]));
  const importedDays: AttendanceDay[] = [];
  const ignoredColumns: string[] = [];
  for (const column of parsed.dayColumns) {
    const day = daysByKey.get(column.dayKey);
    if (!day || day.dayStart > now) ignoredColumns.push(column.header);
    else if (!importedDays.includes(day)) importedDays.push(day);
  }
  importedDays.sort((a, b) => a.dayKey.localeCompare(b.dayKey));

  const participantsByEmail = new Map(participants.map((p) => [p.email.trim().toLowerCase(), p]));
  const plan: AttendanceImportPlan = {
    changes: [],
    matchedCount: 0,
    attendedDays: 0,
    missedDays: 0,
    importedDayKeys: importedDays.map((day) => day.dayKey),
    unknownEmails: [],
    ignoredColumns,
  };

  // A participant listed twice is imported once, from the last row.
  const rowsByEmail = new Map(parsed.rows.map((row) => [row.email, row]));
  for (const row of rowsByEmail.values()) {
    const participant = participantsByEmail.get(row.email);
    if (!participant) {
      plan.unknownEmails.push(row.email);
      continue;
    }
    plan.matchedCount += 1;

    const attendanceBySession = collapseAttendancesBySession(participant.Attendances);
    for (const day of importedDays) {
      const status = row.statusByDay[day.dayKey];
      if (!status) continue;
      const changedSessions = day.sessions.filter(
        (session) => attendanceBySession[session.id]?.status !== status
      );
      if (changedSessions.length === 0) continue;

      for (const session of changedSessions) {
        plan.changes.push({ userId: participant.userId, sessionId: session.id, status });
      }
      if (status === AttendanceStatus_enum.ATTENDED) plan.attendedDays += 1;
      else plan.missedDays += 1;
    }
  }

  return plan;
}
