import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { ManagedCourse_Course_by_pk } from '../../../../queries/__generated__/ManagedCourse';
import TableGrid from '../../../common/TableGrid';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments } from '../../../../queries/__generated__/DegreeParticipantsWithDegreeEnrollments';
import { DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS } from '../../../../queries/courseDegree';
import { CertificateDownload } from '../../../common/CertificateDownload';
import { useTableGrid } from '../../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../../common/TableGrid/utils';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { CREATE_CERTIFICATES } from '../../../../queries/actions';
import { REMOVE_ACHIEVEMENT_CERTIFICATES } from '../../../../queries/courseEnrollment';
import { BulkAction } from '../../../common/TableGrid/types';
import NotificationSnackbar from '../../../common/dialogs/NotificationSnackbar';

interface DegreeParticipationsTabIProps {
  course: ManagedCourse_Course_by_pk;
}

export interface ExtendedDegreeParticipantsEnrollment
  extends DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments {
  name?: string;
  lastApplication?: string;
  ectsTotal?: string;
  attendedEvents?: number;
}

export const DegreeParticipationsTab: FC<DegreeParticipationsTabIProps> = ({ course }) => {
  const t = useTranslations('manageCourse');
  const locale = useLocale();

  const [pageSize, setPageSize] = useState(20);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0);
  };

  const [createCertificates] = useRoleMutation(CREATE_CERTIFICATES);
  const [removeAchievementCertificates] = useRoleMutation(REMOVE_ACHIEVEMENT_CERTIFICATES);

  const { data, loading, error, pageIndex, setPageIndex, searchFilter, setSearchFilter } = useTableGrid({
    queryHook: useRoleQuery,
    query: DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS,
    queryVariables: {
      degreeCourseId: course?.id,
    },
    pageSize,
    refetchFilter: (searchFilter) => {
      const searchCondition = createMultiWordSearchCondition(searchFilter, ['User.firstName', 'User.lastName']);
      return {
        filter: searchCondition,
      };
    },
  });

  const degreeParticipantsEnrollments =
    data?.Course_by_pk?.CourseEnrollments.filter(
      (enrollment) =>
        enrollment.status !== 'REJECTED' && enrollment.status !== 'APPLIED' && enrollment.status !== 'INVITED'
    ) || [];

  // Get total count from the aggregate query
  const totalCount = data?.Course_by_pk?.CourseEnrollments_aggregate?.aggregate?.count || 0;

  // Helper functions for the table columns
  const getMaxUpdatedAt = (courseEnrollments) => {
    if (!courseEnrollments || courseEnrollments.length === 0) {
      return null;
    }
    const maxDate = courseEnrollments
      .map((enrollment) => new Date(enrollment.updated_at))
      .reduce((maxDate, currentDate) => (currentDate > maxDate ? currentDate : maxDate));
    return maxDate.toLocaleString(locale); // Convert the Date object to a string
  };

  const getTotalECTS = (courseEnrollments) => {
    if (!courseEnrollments || courseEnrollments.length === 0) {
      return '0';
    }
    const totalEcts = courseEnrollments
      .filter((enrollment) => enrollment.achievementCertificateURL)
      .reduce((total, current) => {
        const ects = parseFloat(current.Course.ects.replace(',', '.')) || 0;
        return total + ects;
      }, 0);
    const formattedEcts =
      totalEcts === 0
        ? totalEcts.toLocaleString(locale, { maximumFractionDigits: 0 })
        : totalEcts.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return formattedEcts;
  };

  const getAttendedEventsCount = (courseEnrollments) => {
    if (!courseEnrollments || courseEnrollments.length === 0) {
      return 0;
    }
    const attendedEventsCount = courseEnrollments.filter(
      (enrollment) => enrollment.Course.Program.shortTitle === 'EVENTS'
    ).length;

    return attendedEventsCount;
  };

  const formatParticipations = (courseEnrollments) => {
    if (!courseEnrollments || courseEnrollments.length === 0) return '';

    // Passed courses (achievement certificate - highest priority)
    const passedEnrollments = courseEnrollments.filter((ce) => ce.achievementCertificateURL);

    // Attended courses (not passed AND (has attendance certificate OR is an EVENT course))
    const attendedEnrollments = courseEnrollments.filter(
      (ce) =>
        !ce.achievementCertificateURL && (ce.attendanceCertificateURL || ce.Course.Program.shortTitle === 'EVENTS')
    );

    // Enrolled courses (not passed AND not attended by new definition)
    const enrolledEnrollments = courseEnrollments.filter(
      (ce) => !ce.achievementCertificateURL && !ce.attendanceCertificateURL && ce.Course.Program.shortTitle !== 'EVENTS'
    );

    const passed = passedEnrollments.map((ce) => {
      let ects = ce.Course.ects ? ce.Course.ects.replace(',', '.') : '0';
      ects = isNaN(parseFloat(ects)) ? '0' : parseFloat(ects).toString();
      return `${ce.Course.title} (${ce.Course.Program.shortTitle}; ${ects} ECTS)`;
    });

    const attended = attendedEnrollments.map((ce) => `${ce.Course.title} (${ce.Course.Program.shortTitle})`);

    const enrolled = enrolledEnrollments.map((ce) => `${ce.Course.title} (${ce.Course.Program.shortTitle})`);

    let result = '';
    if (passed.length > 0) {
      result += 'Passed: ' + passed.join(', ');
    }
    if (attended.length > 0) {
      if (result) result += '\n';
      result += 'Attended: ' + attended.join(', ');
    }
    if (enrolled.length > 0) {
      if (result) result += '\n';
      result += 'Enrolled: ' + enrolled.join(', ');
    }
    return result;
  };

  const extendedDegreeParticipantsEnrollments: ExtendedDegreeParticipantsEnrollment[] =
    degreeParticipantsEnrollments.map((enrollment) => {
      const name = `${enrollment.User.firstName} ${enrollment.User.lastName}`;
      const lastApplication = getMaxUpdatedAt(enrollment.User.CourseEnrollments) || 'N/A';
      const ectsTotal = getTotalECTS(enrollment.User.CourseEnrollments);
      const attendedEvents = getAttendedEventsCount(enrollment.User.CourseEnrollments);
      const participations = formatParticipations(enrollment.User.CourseEnrollments);

      return {
        ...enrollment,
        name,
        lastApplication,
        ectsTotal,
        attendedEvents,
        participations,
      };
    });

  // Bulk actions for certificate management
  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        value: 'generate-achievement-certificates',
        label: t('generate_achievement_certificates'),
      },
      {
        value: 'delete-achievement-certificates',
        label: t('delete_achievement_certificates'),
      },
    ],
    [t]
  );

  // Handle bulk actions
  const handleBulkAction = useCallback(
    async (action: string, selectedRows: ExtendedDegreeParticipantsEnrollment[]) => {
      if (action === 'generate-achievement-certificates') {
        try {
          const userIds = selectedRows.map((row) => row.User.id);

          const response = await createCertificates({
            variables: {
              courseId: course.id,
              userIds,
              certificateType: 'achievement',
            },
          });

          const result = response.data.createCertificates;

          if (!result.success) {
            throw new Error(result.error || t(`errors:${result.messageKey}`));
          }

          const certCount = result.count;
          const successTranslationKey =
            certCount <= 1
              ? `course-page:${certCount === 0 ? 'no-' : '1-'}certificate-generated`
              : 'course-page:certificates-generated';

          setSnackbarMessage(t(successTranslationKey, { number: certCount }));
          setSnackbarOpen(true);

          // Refetch data to update the table
          setPageIndex(pageIndex); // This triggers a refetch via useTableGrid
        } catch (err) {
          console.error('Certificate generation error:', err);
          setSnackbarMessage(err.message || t('errors.certificate_generation_failed'));
          setSnackbarOpen(true);
        }
      } else if (action === 'delete-achievement-certificates') {
        try {
          const enrollmentIds = selectedRows.map((row) => row.id);

          const response = await removeAchievementCertificates({
            variables: {
              enrollmentIds,
            },
          });

          const affectedRows = response.data?.update_CourseEnrollment?.affected_rows || 0;

          const successTranslationKey =
            affectedRows <= 1
              ? affectedRows === 0
                ? 'manageCourse:no_certificates_deleted'
                : 'manageCourse:certificate_deleted_singular'
              : 'manageCourse:certificates_deleted_plural';

          setSnackbarMessage(t(successTranslationKey, { count: affectedRows }));
          setSnackbarOpen(true);

          // Refetch data to update the table
          setPageIndex(pageIndex); // This triggers a refetch via useTableGrid
        } catch (err) {
          console.error('Certificate deletion error:', err);
          setSnackbarMessage(err.message || t('common.error_handling.certificate_deletion_failed'));
          setSnackbarOpen(true);
        }
      }
    },
    [course.id, createCertificates, removeAchievementCertificates, t, setPageIndex, pageIndex]
  );

  const columns = useMemo<ColumnDef<ExtendedDegreeParticipantsEnrollment>[]>(
    () => [
      {
        header: t('name'),
        accessorKey: 'name',
        enableSorting: true,
        size: 200,
        minSize: 150,
        cell: ({ getValue }) => <div className="uppercase">{getValue<string>()}</div>,
      },
      {
        header: t('participations'),
        accessorKey: 'participations',
        size: 400,
        minSize: 300,
        maxSize: 600,
        cell: ({ getValue }) => <div style={{ whiteSpace: 'pre-line' }}>{getValue<string>()}</div>,
      },
      {
        header: t('lastApplication'),
        accessorKey: 'lastApplication',
        size: 150,
        minSize: 120,
      },
      {
        header: t('status'),
        accessorKey: 'status',
        size: 120,
        minSize: 100,
      },
      {
        header: t('ectsTotal'),
        accessorKey: 'ectsTotal',
        size: 120,
        minSize: 100,
        enableSorting: true,
      },
      {
        header: t('attendedEvents'),
        accessorKey: 'attendedEvents',
        size: 150,
        minSize: 120,
      },
      {
        header: t('certificate'),
        accessorKey: 'certificate',
        accessorFn: (row) => row,
        size: 150,
        minSize: 120,
        cell: ({ getValue }) => (
          <div>
            <CertificateDownload courseEnrollment={getValue<ExtendedDegreeParticipantsEnrollment>()} manageView />
          </div>
        ),
      },
    ],
    [t]
  );

  return (
    <>
      <TableGrid
        columns={columns}
        data={extendedDegreeParticipantsEnrollments}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={handlePageSizeChange}
        searchFilter={searchFilter}
        onSearchFilterChange={setSearchFilter}
        error={error}
        loading={loading}
        showCheckbox={true}
        bulkActions={bulkActions}
        onBulkAction={handleBulkAction}
        refetchQueries={['DegreeParticipantsWithDegreeEnrollments']}
      />
      <NotificationSnackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
};
