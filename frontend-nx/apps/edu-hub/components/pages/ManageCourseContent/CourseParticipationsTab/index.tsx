import { ApolloError, QueryResult } from '@apollo/client';
import { useTranslations, useLocale } from 'next-intl';
import { FC, useCallback, useMemo, useState } from 'react';
import { useIsAdmin } from '../../../../hooks/authentication';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import Dot, { DotColor } from '../../../common/Dot';
import { AttendanceDotsCell } from './AttendanceDotsCell';
import { useOptimisticAttendance } from './useOptimisticAttendance';
import {
  collapseAttendancesBySession,
  getAttendanceStatusFromMap,
  AttendanceOverallStatus,
} from '../../../../helpers/courseParticipationAttendance';
import { CertificateDownload } from '../../../common/CertificateDownload';
import { Card } from '../../../common/Card';
import { useLazyRoleQuery, useRoleQuery } from '../../../../hooks/authedQuery';
import { UPDATE_AN_ACHIEVEMENT_RECORD } from '../../../../queries/achievementRecord';
import {
  INSERT_SINGLE_ATTENDANCE,
  REMOVE_ACHIEVEMENT_CERTIFICATES,
  REMOVE_ATTENDANCE_CERTIFICATES,
} from '../../../../queries/courseEnrollment';
import { CREATE_CERTIFICATES, GET_SIGNED_URL } from '../../../../queries/actions';
import { COURSE_PARTICIPATIONS } from '../../../../queries/courseParticipation';
import {
  CourseParticipations_Course_by_pk_AchievementOptionCourses,
  CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords,
  CourseParticipations_Course_by_pk_CourseEnrollments,
  CourseParticipations_Course_by_pk_Sessions,
  CourseParticipationsVariables,
} from '../../../../queries/__generated__/CourseParticipations';
import {
  UpdateAchievementRecordByPk,
  UpdateAchievementRecordByPkVariables,
} from '../../../../queries/__generated__/UpdateAchievementRecordByPk';
import {
  InsertSingleAttendance,
  InsertSingleAttendanceVariables,
} from '../../../../queries/__generated__/InsertSingleAttendance';
import { GetSignedUrl, GetSignedUrlVariables } from '../../../../queries/__generated__/GetSignedUrl';
import { ManagedCourse_Course_by_pk } from '../../../../queries/__generated__/ManagedCourse';
import { AchievementRecordRating_enum } from '../../../../__generated__/globalTypes';
import { Button } from '../../../common/Button';
import { CircularProgress, Tooltip } from '@mui/material';
import { formattedDateWithTime, makeFullName } from '../../../../helpers/util';
import { IoIosCheckmarkCircle } from 'react-icons/io';
import { GoDotFill } from 'react-icons/go';
import { ColumnDef } from '@tanstack/react-table';
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

interface CourseParticipationsTabIProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

type ExtendedEnrollment = CourseParticipations_Course_by_pk_CourseEnrollments & {
  mostRecentRecord?: CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords;
};

const EMPTY_ENROLLMENTS: CourseParticipations_Course_by_pk_CourseEnrollments[] = [];
const EMPTY_SESSIONS: CourseParticipations_Course_by_pk_Sessions[] = [];
const EMPTY_ACHIEVEMENT_OPTION_COURSES: CourseParticipations_Course_by_pk_AchievementOptionCourses[] = [];

function computeMostRecentRecord(
  enrollment: CourseParticipations_Course_by_pk_CourseEnrollments,
  courseId: number,
  achievementOptionCourses: CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords[]
): CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords | undefined {
  const allRecords = achievementOptionCourses.filter(
    (record) =>
      record.AchievementRecordAuthors.some((author) => author.userId === enrollment.User.id) &&
      record.courseId === courseId
  );
  if (allRecords.length === 0) return undefined;
  const sorted = [...allRecords].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return sorted[0];
}

function flattenAchievementRecords(
  achievementOptionCourses: {
    AchievementOption: { AchievementRecords: CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords[] };
  }[]
): CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords[] {
  return achievementOptionCourses.flatMap((opt) => opt.AchievementOption.AchievementRecords);
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
  const tCoursePage = useTranslations('coursePage');
  const locale = useLocale();
  const isAdmin = useIsAdmin();

  const [pageSize, setPageSize] = useState(20);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);

  const [createCertificates] = useRoleMutation(CREATE_CERTIFICATES);
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
  const courseAchievementOptionCourses = courseData?.AchievementOptionCourses;

  const enrollments = useMemo(
    () => courseEnrollments ?? EMPTY_ENROLLMENTS,
    [courseEnrollments]
  );
  const sessions = useMemo(
    () => courseSessions ?? EMPTY_SESSIONS,
    [courseSessions]
  );
  const achievementOptionCourses = useMemo(
    () => courseAchievementOptionCourses ?? EMPTY_ACHIEVEMENT_OPTION_COURSES,
    [courseAchievementOptionCourses]
  );
  const allRecords = useMemo(
    () => flattenAchievementRecords(achievementOptionCourses),
    [achievementOptionCourses]
  );
  const maxMissedSessions = courseData?.maxMissedSessions ?? course.maxMissedSessions;
  const isInitialLoading = loading && !courseData;

  const [insertAttendance] = useRoleMutation<InsertSingleAttendance, InsertSingleAttendanceVariables>(
    INSERT_SINGLE_ATTENDANCE
  );

  const handleAttendanceError = useCallback(
    (message: string) => {
      setBulkActionError(message || t('attendance_update_failed'));
    },
    [t]
  );

  const { enrollmentsWithOverlay, handleDotClick } = useOptimisticAttendance({
    enrollments,
    sessions,
    insertAttendance,
    refetchParticipations: refetch,
    qResult,
    onError: handleAttendanceError,
  });

  const extendedEnrollments: ExtendedEnrollment[] = useMemo(
    () =>
      enrollmentsWithOverlay.map((enrollment) => ({
        ...enrollment,
        mostRecentRecord: computeMostRecentRecord(enrollment, course.id, allRecords),
      })),
    [enrollmentsWithOverlay, course.id, allRecords]
  );

  const sessionTooltips = useMemo(
    () => sessions.map((session) => new Date(session.startDateTime).toLocaleString(locale)),
    [sessions, locale]
  );

  const attendanceStatusTooltips = useMemo(
    () => ({
      passed: t('attendance_status_passed'),
      failed: t('attendance_status_failed'),
      uncertain: t('attendance_status_uncertain'),
    }),
    [t]
  );

  const totalCount = courseData?.CourseEnrollments_aggregate?.aggregate?.count ?? 0;

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      setPageIndex(0);
    },
    [setPageIndex]
  );

  const handleBulkAction = useCallback(
    async (action: string, selectedRows: ExtendedEnrollment[]) => {
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
            throw new Error(result?.error || t('errors:certificate_generation_failed'));
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
              r.mostRecentRecord?.rating === AchievementRecordRating_enum.PASSED
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
            throw new Error(result?.error || t('errors:certificate_generation_failed'));
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
    return actions;
  }, [isAdmin, course.attendanceCertificatePossible, course.achievementCertificatePossible, t]);


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
          <AttendanceDotsCell
            enrollment={row.original}
            sessions={sessions}
            sessionTooltips={sessionTooltips}
            maxMissedSessions={maxMissedSessions}
            statusTooltipPassed={attendanceStatusTooltips.passed}
            statusTooltipFailed={attendanceStatusTooltips.failed}
            statusTooltipUncertain={attendanceStatusTooltips.uncertain}
            onDotClick={handleDotClick}
          />
        ),
      },
      {
        id: 'achievement',
        header: () => <span className="text-center w-full block">{t('certificate_achievement')}</span>,
        size: 120,
        meta: { className: 'justify-center' },
        cell: ({ row }) => {
          const rec = row.original.mostRecentRecord;
          if (
            !rec?.documentationUrl ||
            rec.documentationUrl === 'pending_upload'
          ) {
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
            rec.rating === AchievementRecordRating_enum.PASSED
              ? 'achievement_passed'
              : rec.rating === AchievementRecordRating_enum.FAILED
                ? 'achievement_failed'
                : 'achievement_unrated';
          const dotColor: DotColor =
            rec.rating === AchievementRecordRating_enum.PASSED
              ? 'lightgreen'
              : rec.rating === AchievementRecordRating_enum.FAILED
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
    [
      t,
      sessions,
      sessionTooltips,
      maxMissedSessions,
      attendanceStatusTooltips,
      handleDotClick,
    ]
  );

  const ExpandableParticipationRow = useCallback(
    ({ row }: { row: ExtendedEnrollment }) => (
      <ExpandableRowContent
        enrollment={row}
        onRefetch={() => {
          refetch();
          qResult.refetch();
        }}
        t={t}
        locale={locale}
      />
    ),
    [refetch, qResult, t, locale]
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
            loading={isInitialLoading}
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
          loading={isInitialLoading}
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
  onRefetch,
  t,
  locale,
}: {
  enrollment: ExtendedEnrollment;
  onRefetch: () => void;
  t: (key: string) => string;
  locale: string;
}) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [getDoc, docResult] = useLazyRoleQuery<GetSignedUrl, GetSignedUrlVariables>(GET_SIGNED_URL);
  const [setAchievementRecord] = useRoleMutation<
    UpdateAchievementRecordByPk,
    UpdateAchievementRecordByPkVariables
  >(UPDATE_AN_ACHIEVEMENT_RECORD);

  const handleDownloadClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      const docPath =
        enrollment.mostRecentRecord?.documentationUrl &&
        enrollment.mostRecentRecord.documentationUrl !== 'pending_upload'
          ? enrollment.mostRecentRecord.documentationUrl
          : null;
      if (!docPath) return;

      setDownloadError(null);
      try {
        const result = await getDoc({
          variables: { path: docPath },
          fetchPolicy: 'network-only',
        });
        const signedUrl = result.data?.getSignedUrl?.link;
        if (signedUrl) {
          window.open(signedUrl, '_blank', 'noopener,noreferrer');
        } else {
          setDownloadError(t('download_documentation_error') || 'Failed to get download URL');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setDownloadError(t('download_documentation_error') || msg);
      }
    },
    [enrollment.mostRecentRecord?.documentationUrl, getDoc, t]
  );

  const onSetRating = useCallback(
    async (rating: AchievementRecordRating_enum) => {
      if (!enrollment.mostRecentRecord) return;
      await setAchievementRecord({
        variables: {
          id: enrollment.mostRecentRecord.id,
          setInput: { rating },
        },
      });
      onRefetch();
    },
    [enrollment.mostRecentRecord, setAchievementRecord, onRefetch]
  );

  const hasDocumentation =
    !!enrollment.mostRecentRecord?.documentationUrl &&
    enrollment.mostRecentRecord.documentationUrl !== 'pending_upload';

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

        {hasDocumentation && enrollment.mostRecentRecord && (() => {
          const record = enrollment.mostRecentRecord;
          if (!record) return null;
          return (
          <Card title={t('documentation_section')}>
            <div className="flex items-center gap-2 mb-4">
              <Dot
                onClick={() => onSetRating(AchievementRecordRating_enum.UNRATED)}
                className="cursor-pointer"
                color="grey"
                size={
                  record.rating === AchievementRecordRating_enum.UNRATED
                    ? 'LARGE'
                    : 'DEFAULT'
                }
              />
              <Dot
                onClick={() => onSetRating(AchievementRecordRating_enum.PASSED)}
                className="cursor-pointer"
                color="lightgreen"
                size={
                  record.rating === AchievementRecordRating_enum.PASSED
                    ? 'LARGE'
                    : 'DEFAULT'
                }
              />
              <Dot
                onClick={() => onSetRating(AchievementRecordRating_enum.FAILED)}
                className="cursor-pointer"
                color="red"
                size={
                  record.rating === AchievementRecordRating_enum.FAILED
                    ? 'LARGE'
                    : 'DEFAULT'
                }
              />
            </div>
            <div className="space-y-1 mb-4 text-sm">
              <div>
                <span className="text-label-secondary">{t('projectTitle')}: </span>
                {record.AchievementOption?.title ?? '-'}
              </div>
              <div>
                <span className="text-label-secondary">{t('uploaded_by')}: </span>
                {(() => {
                  const uploader = (record.AchievementRecordAuthors ?? []).find(
                    (a) => a.userId === record.uploadUserId && a.User
                  );
                  return uploader
                    ? makeFullName(uploader.User?.firstName ?? '', uploader.User?.lastName ?? '')
                    : '-';
                })()}
              </div>
              {(() => {
                const uploadUserId = record.uploadUserId;
                const coAuthors = (record.AchievementRecordAuthors ?? [])
                  .filter((a) => a.userId !== uploadUserId && a.User)
                  .map((a) =>
                    makeFullName(a.User?.firstName ?? '', a.User?.lastName ?? '')
                  );
                if (coAuthors.length === 0) return null;
                return (
                  <div>
                    <span className="text-label-secondary">{t('co_authors')}: </span>
                    {coAuthors.join(', ')}
                  </div>
                );
              })()}
              <div>
                <span className="text-label-secondary">{t('lastRecordUpload')}: </span>
                {formattedDateWithTime(
                  new Date(record.created_at),
                  locale
                )}
              </div>
            </div>
            <Button
              as="button"
              type="button"
              filled
              disabled={docResult.loading}
              onClick={handleDownloadClick}
            >
              {docResult.loading ? (
                <CircularProgress size={20} />
              ) : (
                t('download_documentation')
              )}
            </Button>
            {downloadError && (
              <ErrorMessageDialog
                errorMessage={downloadError}
                open={!!downloadError}
                onClose={() => setDownloadError(null)}
              />
            )}
          </Card>
          );
        })()}

        {hasCertificates && (
          <Card title={t('certificates_section')}>
            <CertificateDownload courseEnrollment={enrollment as any} manageView />
          </Card>
        )}
      </div>
    </div>
  );
}
