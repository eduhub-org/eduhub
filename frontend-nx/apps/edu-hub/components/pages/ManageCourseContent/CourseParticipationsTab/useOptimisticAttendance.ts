import { MutationFunction } from '@apollo/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CourseParticipations_Course_by_pk_Sessions } from '../../../../queries/__generated__/CourseParticipations';
import {
  InsertSingleAttendance,
  InsertSingleAttendanceVariables,
} from '../../../../queries/__generated__/InsertSingleAttendance';
import {
  DeleteManualAttendances,
  DeleteManualAttendancesVariables,
} from '../../../../queries/__generated__/DeleteManualAttendances';
import {
  AttendanceOverride,
  CourseEnrollmentWithAttendances,
  REVERT_TO_AUTOMATIC,
  applyAttendanceOverrides,
  attendanceOverrideKey,
  getNextAttendanceOverride,
  splitAttendancesBySession,
} from '../../../../helpers/courseParticipationAttendance';
import { ATTENDANCE_SOURCE_INSTRUCTOR } from '../../../../helpers/attendance';

const REFETCH_DEBOUNCE_MS = 1500;

interface UseOptimisticAttendanceOptions {
  enrollments: readonly CourseEnrollmentWithAttendances[];
  sessions: readonly CourseParticipations_Course_by_pk_Sessions[];
  insertAttendance: MutationFunction<InsertSingleAttendance, InsertSingleAttendanceVariables>;
  deleteManualAttendances: MutationFunction<DeleteManualAttendances, DeleteManualAttendancesVariables>;
  refetchAttendances: () => Promise<unknown>;
  onError: (message: string) => void;
}

export function useOptimisticAttendance({
  enrollments,
  sessions,
  insertAttendance,
  deleteManualAttendances,
  refetchAttendances,
  onError,
}: UseOptimisticAttendanceOptions) {
  const [overrides, setOverrides] = useState<Record<string, AttendanceOverride>>({});
  const overridesRef = useRef(overrides);
  const overrideVersionsRef = useRef<Record<string, number>>({});
  const nextVersionRef = useRef(0);
  const pendingMutationsRef = useRef(0);
  const mutationQueuesRef = useRef<Record<string, Promise<unknown>>>({});
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const replaceOverrides = useCallback((next: Record<string, AttendanceOverride>) => {
    overridesRef.current = next;
    if (mountedRef.current) setOverrides(next);
  }, []);

  const scheduleBackgroundSync = useCallback(() => {
    if (!mountedRef.current) return;
    if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);

    refetchTimerRef.current = setTimeout(() => {
      refetchTimerRef.current = null;
      if (pendingMutationsRef.current > 0) return;

      const syncedThroughVersion = nextVersionRef.current;
      void refetchAttendances()
        .then(() => {
          if (!mountedRef.current) return;
          const nextOverrides: Record<string, AttendanceOverride> = {};
          const nextVersions: Record<string, number> = {};

          for (const [key, status] of Object.entries(overridesRef.current)) {
            const version = overrideVersionsRef.current[key] ?? 0;
            if (version > syncedThroughVersion) {
              nextOverrides[key] = status;
              nextVersions[key] = version;
            }
          }

          overrideVersionsRef.current = nextVersions;
          replaceOverrides(nextOverrides);
        })
        .catch((error: unknown) => {
          if (mountedRef.current) {
            onError(error instanceof Error ? error.message : String(error));
          }
        });
    }, REFETCH_DEBOUNCE_MS);
  }, [onError, refetchAttendances, replaceOverrides]);

  useEffect(
    () => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
        if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
      };
    },
    []
  );

  const handleDotClick = useCallback(
    (session: CourseParticipations_Course_by_pk_Sessions, userId: string) => {
      const enrollment = enrollments.find((item) => item.userId === userId);
      if (!enrollment) return;

      const key = attendanceOverrideKey(userId, session.id);
      const { manual, automatic } = splitAttendancesBySession(enrollment.User.Attendances)[session.id] ?? {};
      const pending = overridesRef.current[key];
      const manualStatus = pending === undefined ? manual?.status : pending === REVERT_TO_AUTOMATIC ? undefined : pending;
      const nextOverride = getNextAttendanceOverride(manualStatus, automatic?.status);
      const version = ++nextVersionRef.current;

      overrideVersionsRef.current = { ...overrideVersionsRef.current, [key]: version };
      replaceOverrides({ ...overridesRef.current, [key]: nextOverride });
      pendingMutationsRef.current += 1;

      const previousMutation = mutationQueuesRef.current[key] ?? Promise.resolve();
      const mutation = previousMutation
        .catch(() => undefined)
        .then((): Promise<unknown> =>
          nextOverride === REVERT_TO_AUTOMATIC
            ? deleteManualAttendances({ variables: { userId, sessionId: session.id } })
            : insertAttendance({
                variables: {
                  input: {
                    status: nextOverride,
                    sessionId: session.id,
                    source: ATTENDANCE_SOURCE_INSTRUCTOR,
                    userId,
                  },
                },
              })
        );
      mutationQueuesRef.current[key] = mutation;

      void mutation
        .catch((error: unknown) => {
          if (overrideVersionsRef.current[key] === version) {
            const nextOverrides = { ...overridesRef.current };
            const nextVersions = { ...overrideVersionsRef.current };
            delete nextOverrides[key];
            delete nextVersions[key];
            overrideVersionsRef.current = nextVersions;
            replaceOverrides(nextOverrides);
            void refetchAttendances().catch(() => undefined);
          }
          if (mountedRef.current) {
            onError(error instanceof Error ? error.message : String(error));
          }
        })
        .finally(() => {
          pendingMutationsRef.current -= 1;
          if (mutationQueuesRef.current[key] === mutation) {
            delete mutationQueuesRef.current[key];
          }
          scheduleBackgroundSync();
        });
    }, [
      deleteManualAttendances,
      enrollments,
      insertAttendance,
      onError,
      refetchAttendances,
      replaceOverrides,
      scheduleBackgroundSync,
    ]
  );

  const enrollmentsWithOverrides = useMemo(
    () => applyAttendanceOverrides(enrollments, overrides, sessions),
    [enrollments, overrides, sessions]
  );

  return {
    enrollmentsWithOverrides,
    handleDotClick,
  };
}
