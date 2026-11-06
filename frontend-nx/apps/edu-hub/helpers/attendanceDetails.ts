import { AttendanceStatus_enum } from '../__generated__/globalTypes';
import { ATTENDANCE_SOURCE_INSTRUCTOR } from './attendance';

/**
 * Mirrors `functions/callPythonFunction/pythonFunctions/limesurvey_location_mapping.py`:
 * the raw LimeSurvey Place answer → LocationOption.
 */
export const LIMESURVEY_LOCATION_MAPPING: Record<string, string> = {
  SK: 'KIEL',
  Starterkitchen: 'KIEL',
  'Legienstraße 40': 'KIEL',
  Waterkant: 'KIEL',
  Kosmos: 'KIEL',
  KIEL: 'KIEL',
  HEIDE: 'HEIDE',
  H04: 'HEIDE',
};

export const ATTENDANCE_SOURCE_ZOOM = 'ZOOM';

/** Mirrors MIN_ATTENDANCE_SHARE in check_attendance.py. */
export const MIN_ATTENDANCE_SHARE = 0.5;

/** Bucket for Manual Attendances, whose location is unknown. */
export const MANUAL_ATTENDANCE_LOCATION = 'MANUAL';

/**
 * Attendance Location of a record or Attendance: ONLINE for Zoom, the mapped
 * LocationOption for a check-in, or the raw place when it is not mapped.
 */
export const attendanceLocationOption = (
  source: string | null | undefined,
  location: string | null | undefined
): string | null => {
  if (source === ATTENDANCE_SOURCE_ZOOM) return 'ONLINE';
  const place = (location ?? '').trim();
  if (!place) return null;
  return LIMESURVEY_LOCATION_MAPPING[place] ?? place;
};

export interface ClosestCandidate {
  location: string;
  identifier: string;
  score: number;
}

export const parseClosestCandidates = (value: unknown): ClosestCandidate[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (c): c is ClosestCandidate =>
      Boolean(c) && typeof c.identifier === 'string' && typeof c.location === 'string' && typeof c.score === 'number'
  );
};

/** Share of the session (0–1) spent in the online meeting, or null when unknown. */
export const attendanceShare = (
  seconds: number | null | undefined,
  sessionStart: string | null | undefined,
  sessionEnd: string | null | undefined
): number | null => {
  if (seconds == null || !sessionStart || !sessionEnd) return null;
  const sessionSeconds = (Date.parse(sessionEnd) - Date.parse(sessionStart)) / 1000;
  if (!Number.isFinite(sessionSeconds) || sessionSeconds <= 0) return null;
  return seconds / sessionSeconds;
};

export const formatMinutes = (seconds: number | null | undefined): string | null =>
  seconds == null || !Number.isFinite(seconds) ? null : `${Math.round(seconds / 60)} min`;

export const formatPercent = (share: number | null): string | null =>
  share == null ? null : `${Math.round(share * 100)} %`;

interface SessionAttendanceRow {
  id: number;
  userId: string | null;
  status: AttendanceStatus_enum;
  source: string | null;
  location: string | null;
}

export interface SessionAttendanceSummary {
  /** People with an Attendance for the session (the automatic check creates one per Participant). */
  total: number;
  attended: number;
  /** Attended per Attendance Location; Manual Attendances under MANUAL_ATTENDANCE_LOCATION. */
  byLocation: Record<string, number>;
}

/** Counts effective Attendances: a Manual Attendance always wins over the automatic one. */
export const summarizeSessionAttendances = (
  rows: readonly SessionAttendanceRow[]
): SessionAttendanceSummary => {
  const effectiveByUser = new Map<string, SessionAttendanceRow>();
  for (const row of rows) {
    if (!row.userId) continue;
    const current = effectiveByUser.get(row.userId);
    const rowIsManual = row.source === ATTENDANCE_SOURCE_INSTRUCTOR;
    const currentIsManual = current?.source === ATTENDANCE_SOURCE_INSTRUCTOR;
    if (!current || (rowIsManual && !currentIsManual) || (rowIsManual === currentIsManual && row.id > current.id)) {
      effectiveByUser.set(row.userId, row);
    }
  }

  const byLocation: Record<string, number> = {};
  let attended = 0;
  effectiveByUser.forEach((row) => {
    if (row.status !== AttendanceStatus_enum.ATTENDED) return;
    attended += 1;
    const location =
      row.source === ATTENDANCE_SOURCE_INSTRUCTOR
        ? MANUAL_ATTENDANCE_LOCATION
        : attendanceLocationOption(row.source, row.location) ?? MANUAL_ATTENDANCE_LOCATION;
    byLocation[location] = (byLocation[location] ?? 0) + 1;
  });

  return { total: effectiveByUser.size, attended, byLocation };
};

interface AssignableAttendance {
  source: string | null;
  attendanceRecordIndex: number | null;
  recordedIdentifier: string | null;
  matchType: string | null;
  User: { firstName: string; lastName: string } | null;
}

interface AssignableRecord {
  _idx: string;
  name?: unknown;
  email?: unknown;
}

/**
 * Who each Attendance Record was matched to, keyed by the record's index in
 * Session.attendanceData. Sessions checked before Attendances stored their
 * record index fall back to the recorded name or email.
 */
export const assignRecordsToParticipants = (
  records: readonly AssignableRecord[],
  attendances: readonly AssignableAttendance[]
): Record<string, string> => {
  const automatic = attendances.filter((a) => a.source !== ATTENDANCE_SOURCE_INSTRUCTOR && a.User);
  const fullName = (a: AssignableAttendance) => `${a.User?.firstName ?? ''} ${a.User?.lastName ?? ''}`.trim();
  const result: Record<string, string> = {};

  if (automatic.some((a) => a.attendanceRecordIndex != null)) {
    automatic.forEach((a) => {
      if (a.attendanceRecordIndex != null) result[String(a.attendanceRecordIndex)] = fullName(a);
    });
    return result;
  }

  const normalise = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
  automatic
    .filter((a) => a.matchType && a.matchType !== 'NONE' && a.recordedIdentifier)
    .forEach((a) => {
      const identifier = normalise(a.recordedIdentifier);
      const record = records.find(
        (r) => !result[r._idx] && (normalise(r.email) === identifier || normalise(r.name) === identifier)
      );
      if (record) result[record._idx] = fullName(a);
    });
  return result;
};
