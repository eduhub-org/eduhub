import { ApolloError, QueryResult } from '@apollo/client';
import { useTranslations } from 'next-intl';
import { FC, useCallback, useMemo, useState, type JSX } from 'react';
import { useIsAdmin, useIsInstructor } from '../../../../hooks/authentication';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import Dot, { DotColor } from '../../../common/Dot';
import { CertificateDownload } from '../../../common/CertificateDownload';
import { Card } from '../../../common/Card';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import {
  INSERT_SINGLE_ATTENDANCE,
  REMOVE_ACHIEVEMENT_CERTIFICATES,
  REMOVE_ATTENDANCE_CERTIFICATES,
} from '../../../../queries/courseEnrollment';
import { CREATE_CERTIFICATES } from '../../../../queries/actions';
import { COURSE_PARTICIPATIONS } from '../../../../queries/courseParticipation';
import {
  CourseParticipations_Course_by_pk_CourseEnrollments,
  CourseParticipations_Course_by_pk_CourseEnrollments_User_Attendances,
  CourseParticipations_Course_by_pk_ProjectCourses,
  CourseParticipations_Course_by_pk_ProjectCourses_Project,
  CourseParticipations_Course_by_pk_Sessions,
  CourseParticipationsVariables,
} from '../../../../queries/__generated__/CourseParticipations';
import {
  InsertSingleAttendance,
  InsertSingleAttendanceVariables,
} from '../../../../queries/__generated__/InsertSingleAttendance';
import { ManagedCourse_Course_by_pk } from '../../../../queries/__generated__/ManagedCourse';
import {
  AttendanceStatus_enum,
  CourseEnrollmentStatus_enum,
  ProjectRating_enum,
} from '../../../../__generated__/globalTypes';
import { UPDATE_ENROLLMENT_STATUS_WHEN_CONFIRMED } from '../../../../queries/insertEnrollment';
import {
  UpdateEnrollmentStatusWhenConfirmed,
  UpdateEnrollmentStatusWhenConfirmedVariables,
} from '../../../../queries/__generated__/UpdateEnrollmentStatusWhenConfirmed';
import { Tooltip } from '@mui/material';
import { pickEffectiveAttendance } from '../../../../helpers/attendance';
import { certificateActionErrorMessage } from '../../../../helpers/certificateMessages';
import { IoIosCheckmarkCircle } from 'react-icons/io';
import { GoDotFill } from 'react-icons/go';
import { ColumnDef, Row } from '@tanstack/react-table';
import TableGrid from '../../../common/TableGrid';
import { useTableGrid } from '../../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../../common/TableGrid/utils';
import { BulkAction } from '../../../common/TableGrid/types';
import NotificationSnackbar from '../../../common/dialogs/NotificationSnackbar';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import ProjectsManagementGrid from './projects/ProjectsManagementGrid';
import {
  resolveEffectiveCourseProjectSubmissionDeadline,
  getCourseProjectSubmissionDefaultSource,
  submissionDeadlineToIsoString,
} from '../../CourseContent/Projects/projectEffectiveSubmissionDeadline';
import { QuestionConfirmationDialog } from '../../../common/dialogs/QuestionConfirmationDialog';

interface CourseParticipationsTabIProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

type ExtendedEnrollment = CourseParticipations_Course_by_pk_CourseEnrollments & {
  userProject?: CourseParticipations_Course_by_pk_ProjectCourses_Project;
};

const EMPTY_ENROLLMENTS: CourseParticipations_Course_by_pk_CourseEnrollments[] = [];
const EMPTY_SESSIONS: CourseParticipations_Course_by_pk_Sessions[] = [];

interface IDotData {
  color: DotColor;
  session: CourseParticipations_Course_by_pk_Sessions;
}

function findUserProject(
  enrollment: CourseParticipations_Course_by_pk_CourseEnrollments,
  projects: CourseParticipations_Course_by_pk_ProjectCourses_Project[]
): CourseParticipations_Course_by_pk_ProjectCourses_Project | undefined {
  return projects.find((p) =>
    p.ProjectAuthors.some((author) => author.userId === enrollment.User.id)
  );
}

type AttendanceOverallStatus = 'passed' | 'failed' | 'uncertain';

function collapseAttendancesBySession(
  attendances: readonly CourseParticipations_Course_by_pk_CourseEnrollments_User_Attendances[]
): Record<number, CourseParticipations_Course_by_pk_CourseEnrollments_User_Attendances> {
  const bySession = attendances.reduce<
    Record<number, CourseParticipations_Course_by_pk_CourseEnrollments_User_Attendances[]>
  >((prev, curr) => {
    const bucket = prev[curr.Session.id] ?? [];
    bucket.push(curr);
    prev[curr.Session.id] = bucket;
    return prev;
  }, {});

  const result: Record<number, CourseParticipations_Course_by_pk_CourseEnrollments_User_Attendances> = {};
  for (const [sessionId, rows] of Object.entries(bySession)) {
    const effective = pickEffectiveAttendance(rows, (a) => a.id);
    if (effective !== undefined) {
      result[Number(sessionId)] = effective;
    }
  }
  return result;
}

function getAttendanceStatusFromMap(
  attendanceBySession: Record<number, CourseParticipations_Course_by_pk_CourseEnrollments_User_Attendances>,
  sessions: CourseParticipations_Course_by_pk_Sessions[],
  maxMissedSessions: number
): AttendanceOverallStatus {
  let missed = 0;
  let unchecked = 0;
  for (const session of sessions) {
    const att = attendanceBySession[session.id];
    if (!att) {
      unchecked += 1;
    } else if (att.status === AttendanceStatus_enum.MISSED) {
      missed += 1;
    } else if (att.status === AttendanceStatus_enum.NO_INFO) {
      unchecked += 1;
    }
    // ATTENDED: no change to missed or unchecked
  }

  if (missed > maxMissedSessions) return 'failed';
  if (missed + unchecked <= maxMissedSessions) return 'passed';
  return 'uncertain';
}

function getAttendanceStatus(
  enrollment: ExtendedEnrollment,
  sessions: CourseParticipations_Course_by_pk_Sessions[],
  maxMissedSessions: number
): AttendanceOverallStatus {
  const attendanceBySession = collapseAttendancesBySession(enrollment.User.Attendances);
  return getAttendanceStatusFromMap(attendanceBySession, sessions, maxMissedSessions);
}

export const CourseParticipationsTab: FC<CourseParticipationsTabIProps> = ({ course, qResult }) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');
  const tCoursePage = useTranslations('coursePage');
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();

  const [pageSize, setPageSize] = useState(20);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [abortDialogOpen, setAbortDialogOpen] = useState(false);
  const [pendingAbortRows, setPendingAbortRows] = useState<ExtendedEnrollment[]>([]);

  const [createCertificates] = useRoleMutation(CREATE_CERTIFICATES);
  const [updateEnrollmentStatusWhenConfirmed] = useRoleMutation<
    UpdateEnrollmentStatusWhenConfirmed,
    UpdateEnrollmentStatusWhenConfirmedVariables
  >(UPDATE_ENROLLMENT_STATUS_WHEN_CONFIRMED);
  const [removeAchievementCertificates] = useRoleMutation(REMOVE_ACHIEVEMENT_CERTIFICATES);
  const [removeAttendanceCertificates] = useRoleMutation(REMOVE_ATTENDANCE_CERTIFICATES);

  const {
    data,
    loading,
    error,
    pageIndex,
    setPageIndex,
    searchFilter,
    setSearchFilter,
    sorting,
    setSorting,
    refetch,
  } = useTableGrid<CourseParticipationsVariables>({
    queryHook: useRoleQuery,
    query: COURSE_PARTICIPATIONS,
    queryVariables: { courseId: course.id },
    pageSize,
    refetchFilter: (search) => {
      const searchCondition = createMultiWordSearchCondition(search, [
        'User.firstName',
        'User.lastName',
        'User.email',
      ]);
      return { filter: searchCondition };
    },
    sortColumnMapper: (columnId) => {
      switch (columnId) {
        case 'User.firstName':
          return { User: { firstName: null } };
        case 'User.lastName':
          return { User: { lastName: null } };
        default:
          return null;
      }
    },
    defaultSort: [{ User: { lastName: 'asc' } }],
  });

  const courseData = data?.Course_by_pk;
  const courseEnrollments = courseData?.CourseEnrollments;
  const courseSessions = courseData?.Sessions;
  const courseProjectCourses = courseData?.ProjectCourses;

  const enrollments = useMemo(
    () => courseEnrollments ?? EMPTY_ENROLLMENTS,
    [courseEnrollments]
  );
  const sessions = useMemo(
    () => courseSessions ?? EMPTY_SESSIONS,
    [courseSessions]
  );
  const projects = useMemo<CourseParticipations_Course_by_pk_ProjectCourses_Project[]>(
    () =>
      ((courseProjectCourses ?? []) as CourseParticipations_Course_by_pk_ProjectCourses[])
        .map((pc) => pc.Project)
        .filter(Boolean),
    [courseProjectCourses]
  );
  const maxMissedSessions = courseData?.maxMissedSessions ?? course.maxMissedSessions;

  const extendedEnrollments: ExtendedEnrollment[] = useMemo(
    () =>
      enrollments.map((enrollment: CourseParticipations_Course_by_pk_CourseEnrollments) => ({
        ...enrollment,
        userProject: findUserProject(enrollment, projects),
      })),
    [enrollments, projects]
  );

  const totalCount = courseData?.CourseEnrollments_aggregate?.aggregate?.count ?? 0;

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      setPageIndex(0);
    },
    [setPageIndex]
  );

  const handleConfirmAbortParticipations = useCallback(async () => {
    const enrollmentIds = pendingAbortRows.map((r) => r.id);
    setAbortDialogOpen(false);
    setBulkActionError(null);
    try {
      const result = await updateEnrollmentStatusWhenConfirmed({
        variables: {
          enrollmentIds,
          status: CourseEnrollmentStatus_enum.ABORTED,
          courseId: course.id,
        },
      });
      const affectedRows = result.data?.update_CourseEnrollment?.affected_rows ?? 0;
      const messageKey =
        affectedRows === 1
          ? 'participations_bulk_actions.mark_aborted_success_singular'
          : 'participations_bulk_actions.mark_aborted_success_plural';
      setSnackbarMessage(t(messageKey, { count: affectedRows }));
      setSnackbarOpen(true);
      setPendingAbortRows([]);
      refetch();
      qResult.refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setBulkActionError(t('participations_bulk_actions.mark_aborted_error', { error: errorMessage }));
      setPendingAbortRows([]);
      refetch();
      qResult.refetch();
    }
  }, [
    pendingAbortRows,
    updateEnrollmentStatusWhenConfirmed,
    course.id,
    t,
    refetch,
    qResult,
  ]);

  const handleBulkAction = useCallback(
    async (action: string, selectedRows: ExtendedEnrollment[]) => {
      if (action === 'mark_participation_aborted') {
        if (selectedRows.length === 0) {
          return;
        }
        setPendingAbortRows(selectedRows);
        setAbortDialogOpen(true);
        return;
      }

      try {
        if (action === 'generate_attendance_certificates') {
          const qualifyingRows = selectedRows.filter(
            (r) => getAttendanceStatus(r, sessions, maxMissedSessions) === 'passed'
          );
          const skippedCount = selectedRows.length - qualifyingRows.length;
          const userIds = qualifyingRows.map((r) => r.userId);
          const response = await createCertificates({
            variables: {
              courseId: course.id,
              userIds,
              certificateType: 'attendance',
            },
          });
          const result = response.data?.createCertificates;
          if (!result?.success) {
            throw new Error(
              certificateActionErrorMessage(result, t, tCommon('error_handling.certificate_generation_failed'))
            );
          }
          const count = result.count ?? 0;
          const key =
            count <= 1
              ? count === 0
                ? 'no-certificate-generated'
                : '1-certificate-generated'
              : 'certificates-generated';
          let message = tCoursePage(key, { number: count });
          if (skippedCount > 0) {
            const skipKey =
              skippedCount === 1 ? 'certificates_skipped_singular' : 'certificates_skipped_plural';
            message += ` ${t(skipKey, { count: skippedCount })}`;
          }
          setSnackbarMessage(message);
        } else if (action === 'generate_achievement_certificates') {
          const qualifyingRows = selectedRows.filter(
            (r) =>
              getAttendanceStatus(r, sessions, maxMissedSessions) === 'passed' &&
              r.userProject?.rating === ProjectRating_enum.PASSED
          );
          const skippedCount = selectedRows.length - qualifyingRows.length;
          const userIds = qualifyingRows.map((r) => r.userId);
          const response = await createCertificates({
            variables: {
              courseId: course.id,
              userIds,
              certificateType: 'achievement',
            },
          });
          const result = response.data?.createCertificates;
          if (!result?.success) {
            throw new Error(
              certificateActionErrorMessage(result, t, tCommon('error_handling.certificate_generation_failed'))
            );
          }
          const count = result.count ?? 0;
          const key =
            count <= 1
              ? count === 0
                ? 'no-certificate-generated'
                : '1-certificate-generated'
              : 'certificates-generated';
          let message = tCoursePage(key, { number: count });
          if (skippedCount > 0) {
            const skipKey =
              skippedCount === 1 ? 'certificates_skipped_singular' : 'certificates_skipped_plural';
            message += ` ${t(skipKey, { count: skippedCount })}`;
          }
          setSnackbarMessage(message);
        } else if (action === 'delete_attendance_certificates') {
          const enrollmentIds = selectedRows.map((r) => r.id);
          const actuallyDeleted = selectedRows.filter(
            (r) => !!r.attendanceCertificateURL
          ).length;
          await removeAttendanceCertificates({
            variables: { enrollmentIds },
          });
          const key =
            actuallyDeleted <= 1
              ? actuallyDeleted === 0
                ? 'no_attendance_certificates_deleted'
                : 'attendance_certificate_deleted_singular'
              : 'attendance_certificates_deleted_plural';
          setSnackbarMessage(t(key, { count: actuallyDeleted }));
        } else if (action === 'delete_achievement_certificates') {
          const enrollmentIds = selectedRows.map((r) => r.id);
          const actuallyDeleted = selectedRows.filter(
            (r) => !!r.achievementCertificateURL
          ).length;
          await removeAchievementCertificates({
            variables: { enrollmentIds },
          });
          const key =
            actuallyDeleted <= 1
              ? actuallyDeleted === 0
                ? 'no_certificates_deleted'
                : 'certificate_deleted_singular'
              : 'certificates_deleted_plural';
          setSnackbarMessage(t(key, { count: actuallyDeleted }));
        } else if (action === 'email_selected') {
          const emails = selectedRows
            .map((r) => r.User?.email)
            .filter(Boolean)
            .join(',');
          if (emails) {
            window.location.href = `mailto:?bcc=${emails}`;
          }
          return;
        }
        setSnackbarOpen(true);
        refetch();
        qResult.refetch();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setBulkActionError(msg);
        refetch();
        qResult.refetch();
      }
    },
    [
      course.id,
      createCertificates,
      removeAchievementCertificates,
      removeAttendanceCertificates,
      t,
      tCommon,
      tCoursePage,
      refetch,
      qResult,
      sessions,
      maxMissedSessions,
    ]
  );

  const bulkActions: BulkAction[] = useMemo(() => {
    const actions: BulkAction[] = [];
    if (isAdmin && course.attendanceCertificatePossible) {
      actions.push(
        {
          value: 'generate_attendance_certificates',
          label: t('generate_attendance_certificates'),
          group: t('certificates_group'),
        },
        {
          value: 'delete_attendance_certificates',
          label: t('delete_attendance_certificates'),
          group: t('certificates_group'),
        }
      );
    }
    if (isAdmin && course.achievementCertificatePossible) {
      actions.push(
        {
          value: 'generate_achievement_certificates',
          label: t('generate_achievement_certificates'),
          group: t('certificates_group'),
        },
        {
          value: 'delete_achievement_certificates',
          label: t('delete_achievement_certificates'),
          group: t('certificates_group'),
        }
      );
    }
    actions.push({
      value: 'email_selected',
      label: t('bulk_actions.email_selected'),
    });
    if (isInstructor) {
      actions.push({
        value: 'mark_participation_aborted',
        label: t('participations_bulk_actions.mark_aborted_selected'),
      });
    }
    return actions;
  }, [
    isAdmin,
    isInstructor,
    course.attendanceCertificatePossible,
    course.achievementCertificatePossible,
    t,
  ]);

  const AttendanceDotsCell = useMemo(() => {
    return function AttendanceDotsCellInner({
      row,
      onDotClick,
    }: {
      row: Row<ExtendedEnrollment>;
      onDotClick: (session: CourseParticipations_Course_by_pk_Sessions, userId: string) => void;
    }) {
      const enrollment = row.original;
      const attendanceBySession = collapseAttendancesBySession(enrollment.User.Attendances);

      const dotColor = (sn: CourseParticipations_Course_by_pk_Sessions): DotColor => {
        const att = attendanceBySession[sn.id];
        if (!att) return 'grey';
        if (att.status === AttendanceStatus_enum.MISSED) return 'red';
        if (att.status === AttendanceStatus_enum.ATTENDED) return 'lightgreen';
        return 'grey';
      };

      const dotsData: IDotData[] = sessions.map((s: CourseParticipations_Course_by_pk_Sessions) => ({ session: s, color: dotColor(s) }));
      const missed = dotsData.filter((d) => d.color === 'red').length;
      const attended = dotsData.filter((d) => d.color === 'lightgreen').length;
      const total = attended + missed;
      const status = getAttendanceStatusFromMap(attendanceBySession, sessions, maxMissedSessions);
      const statusDotColor: DotColor =
        status === 'passed' ? 'lightgreen' : status === 'failed' ? 'red' : 'grey';
      const statusTooltip =
        status === 'passed'
          ? t('attendance_status_passed')
          : status === 'failed'
            ? t('attendance_status_failed')
            : t('attendance_status_uncertain');

      return (
        <div className="flex flex-row items-center gap-4">
          <div className="flex flex-row items-center gap-1 flex-wrap">
            {dotsData.map((d) => (
              <Dot
                key={d.session.id}
                color={d.color}
                className="cursor-pointer hover:border-2 hover:border-indigo-200 hover:rounded-full"
                title={new Date(d.session.startDateTime).toLocaleString()}
                onClick={() => onDotClick(d.session, enrollment.userId)}
              />
            ))}
          </div>
          <div className="flex flex-row items-center gap-1 flex-shrink-0">
            <span className="text-label-primary text-sm whitespace-nowrap">{`${attended}/${total}`}</span>
            <Tooltip title={statusTooltip}>
              <span className="inline-flex">
                <Dot color={statusDotColor} />
              </span>
            </Tooltip>
          </div>
        </div>
      );
    };
  }, [sessions, maxMissedSessions, t]);

  const [insertAttendance] = useRoleMutation<InsertSingleAttendance, InsertSingleAttendanceVariables>(
    INSERT_SINGLE_ATTENDANCE
  );

  const handleDotClick = useCallback(
    async (session: CourseParticipations_Course_by_pk_Sessions, userId: string) => {
      const enrollment = extendedEnrollments.find((e) => e.userId === userId);
      if (!enrollment) return;
      const attBySession = collapseAttendancesBySession(enrollment.User.Attendances);
      const att = attBySession[session.id];
      let status: AttendanceStatus_enum;
      if (
        !att ||
        att.status === AttendanceStatus_enum.MISSED ||
        att.status === AttendanceStatus_enum.NO_INFO
      ) {
        status = AttendanceStatus_enum.ATTENDED;
      } else {
        status = AttendanceStatus_enum.MISSED;
      }
      await insertAttendance({
        variables: {
          input: {
            status,
            sessionId: session.id,
            source: 'INSTRUCTOR',
            userId,
          },
        },
      });
      refetch();
      qResult.refetch();
    },
    [insertAttendance, extendedEnrollments, refetch, qResult]
  );

  const columns = useMemo<ColumnDef<ExtendedEnrollment>[]>(
    () => [
      {
        id: 'User.firstName',
        header: t('first_name'),
        accessorKey: 'User.firstName',
        size: 150,
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-label-primary truncate">{row.original.User.firstName}</span>
        ),
      },
      {
        id: 'User.lastName',
        header: t('last_name'),
        accessorKey: 'User.lastName',
        size: 150,
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-label-primary truncate">{row.original.User.lastName}</span>
        ),
      },
      {
        id: 'attendances',
        header: t('attendances'),
        size: 300,
        cell: ({ row }) => (
          <AttendanceDotsCell row={row} onDotClick={handleDotClick} />
        ),
      },
      {
        id: 'achievement',
        header: () => <span className="text-center w-full block">{t('certificate_achievement')}</span>,
        size: 120,
        meta: { className: 'justify-center' },
        cell: ({ row }) => {
          const project = row.original.userProject;
          if (!project) {
            return (
              <Tooltip title={t('achievement_not_submitted')}>
                <div className="flex items-center justify-center">
                  <span
                    className="text-label-disabled text-xl font-light leading-none"
                    style={{ color: 'var(--eduhub-label-disabled)' }}
                    aria-hidden
                  >
                    −
                  </span>
                </div>
              </Tooltip>
            );
          }
          const tooltipKey =
            project.rating === ProjectRating_enum.PASSED
              ? 'achievement_passed'
              : project.rating === ProjectRating_enum.FAILED
                ? 'achievement_failed'
                : 'achievement_unrated';
          const dotColor: DotColor =
            project.rating === ProjectRating_enum.PASSED
              ? 'lightgreen'
              : project.rating === ProjectRating_enum.FAILED
                ? 'red'
                : 'grey';
          return (
            <Tooltip title={t(tooltipKey)}>
              <div className="flex items-center justify-center">
                <Dot color={dotColor} />
              </div>
            </Tooltip>
          );
        },
      },
      {
        id: 'attendance_cert',
        header: () => <span className="text-center w-full block">{t('attendance_cert_col')}</span>,
        size: 100,
        meta: { className: 'justify-center' },
        cell: ({ row }) => {
          const hasCert = !!row.original.attendanceCertificateURL;
          return (
            <Tooltip
              title={hasCert ? t('attendance_cert_issued') : t('attendance_cert_not_issued')}
            >
              <div className="flex items-center justify-center">
                {hasCert ? (
                  <IoIosCheckmarkCircle
                    className="text-eduhub-success"
                    size={24}
                    style={{ color: 'var(--eduhub-success)' }}
                  />
                ) : (
                  <GoDotFill
                    className="text-label-disabled"
                    size={20}
                    style={{ color: 'var(--eduhub-label-disabled)' }}
                  />
                )}
              </div>
            </Tooltip>
          );
        },
      },
      {
        id: 'achievement_cert',
        header: () => <span className="text-center w-full block">{t('achievement_cert_col')}</span>,
        size: 100,
        meta: { className: 'justify-center' },
        cell: ({ row }) => {
          const hasCert = !!row.original.achievementCertificateURL;
          return (
            <Tooltip
              title={hasCert ? t('achievement_cert_issued') : t('achievement_cert_not_issued')}
            >
              <div className="flex items-center justify-center">
                {hasCert ? (
                  <IoIosCheckmarkCircle
                    size={24}
                    style={{ color: 'var(--eduhub-success)' }}
                  />
                ) : (
                  <GoDotFill
                    size={20}
                    style={{ color: 'var(--eduhub-label-disabled)' }}
                  />
                )}
              </div>
            </Tooltip>
          );
        },
      },
    ],
    [t, AttendanceDotsCell, handleDotClick]
  );

  const ExpandableParticipationRow = useCallback(
    ({ row }: { row: ExtendedEnrollment }) => (
      <ExpandableRowContent enrollment={row} t={t} />
    ),
    [t]
  );

  const abortConfirmationDialog = (
    <QuestionConfirmationDialog
      open={abortDialogOpen}
      question={
        pendingAbortRows.length === 1
          ? t('participations_bulk_actions.mark_aborted_confirm_singular')
          : t('participations_bulk_actions.mark_aborted_confirm_plural', {
              count: pendingAbortRows.length,
            })
      }
      confirmationText={tCommon('confirm')}
      cancelText={tCommon('cancel')}
      onClose={() => {
        setAbortDialogOpen(false);
        setPendingAbortRows([]);
      }}
      onCancel={() => {
        setAbortDialogOpen(false);
        setPendingAbortRows([]);
      }}
      onConfirm={handleConfirmAbortParticipations}
    />
  );

  if (!course.achievementCertificatePossible) {
    return (
      <div className="flex flex-col gap-8">
        <section className="space-y-3 rounded-lg border border-border-primary bg-bg-secondary/40 p-4 sm:p-5">
          <header className="border-b border-border-primary pb-3">
            <h2 className="text-lg font-semibold text-label-primary tracking-tight">
              {t('participations_tab_enrollments_heading')}
            </h2>
            <p className="mt-1 text-sm text-label-secondary max-w-3xl">
              {t('participations_tab_enrollments_subtitle')}
            </p>
          </header>
          <ParticipationTable
            columns={columns}
            data={extendedEnrollments}
            totalCount={totalCount}
            pageIndex={pageIndex}
            setPageIndex={setPageIndex}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            searchFilter={searchFilter}
            setSearchFilter={setSearchFilter}
            sorting={sorting}
            setSorting={setSorting}
            loading={loading}
            error={error}
            bulkActions={bulkActions}
            onBulkAction={handleBulkAction}
            expandableRowComponent={ExpandableParticipationRow}
          />
        </section>
        <NotificationSnackbar
          open={snackbarOpen}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
          duration={undefined}
        />
        {bulkActionError && (
          <ErrorMessageDialog
            errorMessage={bulkActionError}
            open={!!bulkActionError}
            onClose={() => setBulkActionError(null)}
          />
        )}
        {abortConfirmationDialog}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-3 rounded-lg border border-border-primary bg-bg-secondary/40 p-4 sm:p-5">
        <header className="border-b border-border-primary pb-3">
          <h2 className="text-lg font-semibold text-label-primary tracking-tight">
            {t('participations_tab_projects_heading')}
          </h2>
          <p className="mt-1 text-sm text-label-secondary max-w-3xl">
            {t('participations_tab_projects_subtitle')}
          </p>
        </header>
        <ProjectsManagementGrid
          courseId={course.id}
          programDefaultProjectType={course.Program?.defaultProjectType ?? null}
          courseDefaultProjectSubmissionDeadline={submissionDeadlineToIsoString(
            resolveEffectiveCourseProjectSubmissionDeadline(course)
          )}
          courseSubmissionDeadlineDefaultSource={getCourseProjectSubmissionDefaultSource(course)}
        />
      </section>

      <section className="space-y-3 rounded-lg border border-border-primary bg-bg-secondary/40 p-4 sm:p-5">
        <header className="border-b border-border-primary pb-3">
          <h2 className="text-lg font-semibold text-label-primary tracking-tight">
            {t('participations_tab_enrollments_heading')}
          </h2>
          <p className="mt-1 text-sm text-label-secondary max-w-3xl">
            {t('participations_tab_enrollments_subtitle')}
          </p>
        </header>
        <ParticipationTable
          columns={columns}
          data={extendedEnrollments}
          totalCount={totalCount}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          searchFilter={searchFilter}
          setSearchFilter={setSearchFilter}
          sorting={sorting}
          setSorting={setSorting}
          loading={loading}
          error={error}
          bulkActions={bulkActions}
          onBulkAction={handleBulkAction}
          expandableRowComponent={ExpandableParticipationRow}
        />
      </section>
      <NotificationSnackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        duration={undefined}
      />
      {bulkActionError && (
        <ErrorMessageDialog
          errorMessage={bulkActionError}
          open={!!bulkActionError}
          onClose={() => setBulkActionError(null)}
        />
      )}
      {abortConfirmationDialog}
    </div>
  );
};

function ParticipationTable({
  columns,
  data,
  totalCount,
  pageIndex,
  setPageIndex,
  pageSize,
  onPageSizeChange,
  searchFilter,
  setSearchFilter,
  sorting,
  setSorting,
  loading,
  error,
  bulkActions,
  onBulkAction,
  expandableRowComponent,
}: {
  columns: ColumnDef<ExtendedEnrollment>[];
  data: ExtendedEnrollment[];
  totalCount: number;
  pageIndex: number;
  setPageIndex: (i: number) => void;
  pageSize: number;
  onPageSizeChange: (s: number) => void;
  searchFilter: string;
  setSearchFilter: (s: string) => void;
  sorting: any;
  setSorting: any;
  loading: boolean;
  error: ApolloError | null | undefined;
  bulkActions: BulkAction[];
  onBulkAction: (action: string, rows: ExtendedEnrollment[]) => void;
  expandableRowComponent: (props: { row: ExtendedEnrollment }) => JSX.Element;
}) {
  return (
    <TableGrid<ExtendedEnrollment>
      columns={columns}
      data={data}
      totalCount={totalCount}
      pageIndex={pageIndex}
      onPageChange={setPageIndex}
      pageSize={pageSize}
      onPageSizeChange={onPageSizeChange}
      searchFilter={searchFilter}
      onSearchFilterChange={setSearchFilter}
      sorting={sorting}
      onSortingChange={setSorting}
      loading={loading}
      error={error}
      refetchQueries={['CourseParticipations']}
      showCheckbox={true}
      bulkActions={bulkActions}
      onBulkAction={onBulkAction}
      expandableRowComponent={expandableRowComponent}
    />
  );
}

function ExpandableRowContent({
  enrollment,
  t,
}: {
  enrollment: ExtendedEnrollment;
  t: (key: string) => string;
}) {
  const hasCertificates =
    !!enrollment.attendanceCertificateURL || !!enrollment.achievementCertificateURL;

  return (
    <div className="bg-fill-primary text-label-primary light p-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        <Card title={t('email')}>
          <div className="text-label-primary break-words text-sm">
            {enrollment.User?.email ?? '-'}
          </div>
        </Card>

        {hasCertificates && (
          <Card title={t('certificates_section')}>
            <CertificateDownload courseEnrollment={enrollment as any} manageView />
          </Card>
        )}
      </div>
    </div>
  );
}
