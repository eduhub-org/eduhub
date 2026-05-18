import { useCallback, useEffect, useRef, useState } from 'react';
import { QueryResult } from '@apollo/client';
import { AttendanceStatus_enum } from '../../../../__generated__/globalTypes';
import {
  attendanceOverlayKey,
  applyAttendanceOverlay,
  getNextAttendanceStatus,
  collapseAttendancesBySession,
  AttendanceLike,
} from '../../../../helpers/courseParticipationAttendance';
import { ATTENDANCE_SOURCE_INSTRUCTOR } from '../../../../helpers/attendance';
import {
  CourseParticipations_Course_by_pk_Sessions,
} from '../../../../queries/__generated__/CourseParticipations';
import {
  InsertSingleAttendance,
  InsertSingleAttendanceVariables,
} from '../../../../queries/__generated__/InsertSingleAttendance';

const REFETCH_DEBOUNCE_MS = 1500;

type EnrollmentWithAttendances = {
  userId: string;
  User: { Attendances: AttendanceLike[] };
};

interface UseOptimisticAttendanceOptions<T extends EnrollmentWithAttendances> {
  enrollments: readonly T[];
  sessions: readonly CourseParticipations_Course_by_pk_Sessions[];
  insertAttendance: (options: {
    variables: InsertSingleAttendanceVariables;
  }) => Promise<{ data?: InsertSingleAttendance }>;
  refetchParticipations: () => Promise<unknown>;
  qResult: Pick<QueryResult<unknown, unknown>, 'refetch'>;
  onError: (message: string) => void;
}

export function useOptimisticAttendance<T extends EnrollmentWithAttendances>({
  enrollments,
  sessions,
  insertAttendance,
  refetchParticipations,
  qResult,
  onError,
}: UseOptimisticAttendanceOptions<T>) {
  const [overlay, setOverlay] = useState<Record<string, AttendanceStatus_enum>>({});
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMutationsRef = useRef(0);

  const clearRefetchTimer = useCallback(() => {
    if (refetchTimerRef.current !== null) {
      clearTimeout(refetchTimerRef.current);
      refetchTimerRef.current = null;
    }
  }, []);

  const scheduleBackgroundSync = useCallback(() => {
    clearRefetchTimer();
    refetchTimerRef.current = setTimeout(() => {
      refetchTimerRef.current = null;
      void Promise.all([
        refetchParticipations(),
        qResult.refetch(),
      ]).finally(() => {
        if (pendingMutationsRef.current === 0) {
          setOverlay({});
        }
      });
    }, REFETCH_DEBOUNCE_MS);
  }, [clearRefetchTimer, refetchParticipations, qResult]);

  useEffect(() => () => clearRefetchTimer(), [clearRefetchTimer]);

  const enrollmentsWithOverlay = applyAttendanceOverlay(enrollments, overlay, sessions);

  const handleDotClick = useCallback(
    (session: CourseParticipations_Course_by_pk_Sessions, userId: string) => {
      const enrollment = enrollments.find((e) => e.userId === userId);
      if (!enrollment) return;

      const attBySession = collapseAttendancesBySession(enrollment.User.Attendances);
      const overlayKey = attendanceOverlayKey(userId, session.id);
      const current =
        overlay[overlayKey] !== undefined
          ? { status: overlay[overlayKey], source: ATTENDANCE_SOURCE_INSTRUCTOR, Session: session, id: -1 }
          : attBySession[session.id];
      const nextStatus = getNextAttendanceStatus(current);

      setOverlay((prev) => ({ ...prev, [overlayKey]: nextStatus }));
      pendingMutationsRef.current += 1;

      void insertAttendance({
        variables: {
          input: {
            status: nextStatus,
            sessionId: session.id,
            source: ATTENDANCE_SOURCE_INSTRUCTOR,
            userId,
          },
        },
      })
        .then(() => {
          pendingMutationsRef.current -= 1;
          scheduleBackgroundSync();
        })
        .catch((err: unknown) => {
          pendingMutationsRef.current -= 1;
          setOverlay((prev) => {
            const next = { ...prev };
            delete next[overlayKey];
            return next;
          });
          const msg = err instanceof Error ? err.message : String(err);
          onError(msg);
          void refetchParticipations();
        });
    },
    [enrollments, overlay, insertAttendance, scheduleBackgroundSync, onError, refetchParticipations]
  );

  return {
    enrollmentsWithOverlay,
    handleDotClick,
    hasPendingOverlay: Object.keys(overlay).length > 0,
  };
}
