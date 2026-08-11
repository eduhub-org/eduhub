import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { ManagedCourse_Course_by_pk } from '../../../../queries/__generated__/ManagedCourse';
import TableGrid from '../../../common/TableGrid';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import type {
  DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments,
  DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments_User_CourseEnrollments,
  DegreeParticipantsWithDegreeEnrollmentsVariables,
} from '../../../../queries/__generated__/DegreeParticipantsWithDegreeEnrollments';
import { DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS } from '../../../../queries/courseDegree';
import { CertificateDownload } from '../../../common/CertificateDownload';
import { useTableGrid } from '../../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../../common/TableGrid/utils';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { CREATE_CERTIFICATES } from '../../../../queries/actions';
import { REMOVE_ACHIEVEMENT_CERTIFICATES } from '../../../../queries/courseEnrollment';
import { BulkAction } from '../../../common/TableGrid/types';
import NotificationSnackbar from '../../../common/dialogs/NotificationSnackbar';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import { CourseEnrollmentStatus_enum } from '../../../../__generated__/globalTypes';
import Card from '../../../common/Card';
import { certificateActionErrorMessage } from '../../../../helpers/certificateMessages';

interface DegreeParticipationsTabIProps {
  course: ManagedCourse_Course_by_pk;
}

interface DegreeParticipationListItem {
  id: number;
  title: string;
  programShortTitle: string;
  ects?: string;
}

interface DegreeParticipationGroups {
  passed: DegreeParticipationListItem[];
  attended: DegreeParticipationListItem[];
  not_completed: DegreeParticipationListItem[];
}

interface ParticipationGroupCardProps {
  title: string;
  items: DegreeParticipationListItem[];
  showEcts?: boolean;
}

interface ExpandableDegreeParticipationRowProps {
  row: ExtendedDegreeParticipantsEnrollment;
  titles: {
    passed: string;
    attended: string;
    not_completed: string;
  };
}

export interface ExtendedDegreeParticipantsEnrollment
  extends DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments {
  name?: string;
  lastApplication?: string;
  ectsTotal?: string;
  attendedEvents?: number;
  participationGroups?: DegreeParticipationGroups;
}

const EMPTY_PARTICIPATION_GROUPS: DegreeParticipationGroups = {
  passed: [],
  attended: [],
  not_completed: [],
};

const ParticipationGroupCard: FC<ParticipationGroupCardProps> = ({
  title,
  items,
  showEcts,
}) => (
  <Card title={title} className="h-full">
    {items.length > 0 && (
      <ul className="space-y-2 text-sm text-label-primary">
        {items.map((item) => (
          <li key={item.id} className="break-words">
            {item.title} ({item.programShortTitle}
            {showEcts && item.ects ? `; ${item.ects} ECTS` : ''})
          </li>
        ))}
      </ul>
    )}
  </Card>
);

const ExpandableDegreeParticipationRow: FC<ExpandableDegreeParticipationRowProps> = ({
  row,
  titles,
}) => {
  const participationGroups = row.participationGroups ?? EMPTY_PARTICIPATION_GROUPS;

  return (
    <div className="bg-fill-primary text-label-primary light p-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        <ParticipationGroupCard
          title={`${titles.passed} (${participationGroups.passed.length})`}
          items={participationGroups.passed}
          showEcts
        />
        <ParticipationGroupCard
          title={`${titles.attended} (${participationGroups.attended.length})`}
          items={participationGroups.attended}
        />
        <ParticipationGroupCard
          title={`${titles.not_completed} (${participationGroups.not_completed.length})`}
          items={participationGroups.not_completed}
        />
      </div>
    </div>
  );
};

export const DegreeParticipationsTab: FC<DegreeParticipationsTabIProps> = ({ course }) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [pageSize, setPageSize] = useState(20);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0);
  };

  const [createCertificates] = useRoleMutation(CREATE_CERTIFICATES);
  const [removeAchievementCertificates] = useRoleMutation(REMOVE_ACHIEVEMENT_CERTIFICATES);

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
  } = useTableGrid<DegreeParticipantsWithDegreeEnrollmentsVariables>({
    queryHook: useRoleQuery,
    query: DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS,
    queryVariables: {
      degreeCourseId: course?.id,
    },
    pageSize,
    refetchFilter: (searchFilter) => {
      const searchCondition = createMultiWordSearchCondition(searchFilter, ['User.firstName', 'User.lastName']);
      const visibleStatusCondition = {
        status: {
          _nin: [
            CourseEnrollmentStatus_enum.REJECTED,
            CourseEnrollmentStatus_enum.APPLIED,
            CourseEnrollmentStatus_enum.INVITED,
          ],
        },
      };

      return {
        filter: {
          _and: Object.keys(searchCondition).length > 0
            ? [visibleStatusCondition, searchCondition]
            : [visibleStatusCondition],
        },
      };
    },
    sortColumnMapper: (columnId) => {
      const stableNameSort = [
        { User: { lastName: 'asc' } },
        { User: { firstName: 'asc' } },
        { id: 'asc' },
      ];

      switch (columnId) {
        case 'name':
          return [
            { User: { lastName: null } },
            { User: { firstName: null } },
            { id: 'asc' },
          ];
        case 'ectsTotal':
          return [
            { DegreeParticipationStats: { ectsTotal: null } },
            ...stableNameSort,
          ];
        case 'attendedEvents':
          return [
            { DegreeParticipationStats: { attendedEventCount: null } },
            ...stableNameSort,
          ];
        default:
          return null;
      }
    },
  });

  const degreeParticipantsEnrollments =
    data?.Course_by_pk?.CourseEnrollments || [];

  // Get total count from the aggregate query
  const totalCount = data?.Course_by_pk?.CourseEnrollments_aggregate?.aggregate?.count || 0;

  // Helper functions for the table columns
  const getMaxUpdatedAt = (courseEnrollments: DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments_User_CourseEnrollments[]) => {
    if (!courseEnrollments || courseEnrollments.length === 0) {
      return null;
    }
    const maxDate = courseEnrollments
      .map((enrollment) => new Date(enrollment.updated_at))
      .reduce((maxDate: Date, currentDate: Date) => (Math.max(maxDate.getTime(), currentDate.getTime()) > maxDate.getTime() ? currentDate : maxDate));
    return maxDate.toLocaleString(locale); // Convert the Date object to a string
  };

  const formatTotalECTS = (ectsTotal: number | string | null | undefined) => {
    const totalEcts = Number.parseFloat(String(ectsTotal ?? 0)) || 0;
    const formattedEcts =
      totalEcts === 0
        ? totalEcts.toLocaleString(locale, { maximumFractionDigits: 0 })
        : totalEcts.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return formattedEcts;
  };

  const formatCourseEcts = (ects: string | null | undefined) => {
    const parsedEcts = Number.parseFloat((ects ?? '0').replace(',', '.'));
    return Number.isNaN(parsedEcts)
      ? '0'
      : parsedEcts.toLocaleString(locale, { maximumFractionDigits: 1 });
  };

  const getParticipationGroups = (courseEnrollments: DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments_User_CourseEnrollments[]) => {
    type CeType = DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments_User_CourseEnrollments;
    // Passed courses (achievement certificate - highest priority)
    const passedEnrollments = courseEnrollments.filter((ce: CeType) => ce.achievementCertificateURL);

    // Attended courses (not passed AND (has attendance certificate OR is an EVENT course))
    const attendedEnrollments = courseEnrollments.filter(
      (ce: CeType) =>
        !ce.achievementCertificateURL && (ce.attendanceCertificateURL || ce.Course.Program.type === 'EVENTS')
    );

    // Not completed courses (not passed AND not attended by new definition)
    const notCompletedEnrollments = courseEnrollments.filter(
      (ce: CeType) => !ce.achievementCertificateURL && !ce.attendanceCertificateURL && ce.Course.Program.type !== 'EVENTS'
    );

    const mapParticipation = (ce: CeType): DegreeParticipationListItem => ({
      id: ce.id,
      title: ce.Course.title ?? '-',
      programShortTitle: ce.Course.Program.shortTitle ?? '-',
      ects: ce.Course.ects ? formatCourseEcts(ce.Course.ects) : undefined,
    });

    return {
      passed: passedEnrollments.map(mapParticipation),
      attended: attendedEnrollments.map(mapParticipation),
      not_completed: notCompletedEnrollments.map(mapParticipation),
    };
  };

  const extendedDegreeParticipantsEnrollments: ExtendedDegreeParticipantsEnrollment[] =
    degreeParticipantsEnrollments.map((enrollment: DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments) => {
      const name = `${enrollment.User.firstName} ${enrollment.User.lastName}`;
      const lastApplication = getMaxUpdatedAt(enrollment.User.CourseEnrollments) || 'N/A';
      const ectsTotal = formatTotalECTS(enrollment.DegreeParticipationStats?.ectsTotal);
      const attendedEvents = Number(enrollment.DegreeParticipationStats?.attendedEventCount ?? 0);
      const participationGroups = getParticipationGroups(enrollment.User.CourseEnrollments);

      return {
        ...enrollment,
        name,
        lastApplication,
        ectsTotal,
        attendedEvents,
        participationGroups,
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

          const result = response.data?.createCertificates;

          if (!result?.success) {
            throw new Error(
              certificateActionErrorMessage(result, t, tCommon('error_handling.certificate_generation_failed'))
            );
          }

          const certCount = result.count ?? 0;
          let successTranslationKey: string;
          if (certCount <= 1) {
            successTranslationKey = certCount === 0
              ? 'no-certificate-generated'
              : '1-certificate-generated';
          } else {
            successTranslationKey = 'certificates-generated';
          }

          setSnackbarMessage(t(successTranslationKey, { number: certCount }));
          setSnackbarOpen(true);

          // Refetch data to update the table
          setPageIndex(pageIndex); // This triggers a refetch via useTableGrid
        } catch (err) {
          console.error('Certificate generation error:', err);
          setBulkActionError(err instanceof Error ? err.message : tCommon('error_handling.certificate_generation_failed'));
        }
      } else if (action === 'delete-achievement-certificates') {
        try {
          const enrollmentIds = selectedRows.map((row) => row.id);
          const actuallyDeleted = selectedRows.filter(
            (row) => !!row.achievementCertificateURL
          ).length;

          await removeAchievementCertificates({
            variables: {
              enrollmentIds,
            },
          });

          let successTranslationKey: string;
          if (actuallyDeleted <= 1) {
            successTranslationKey = actuallyDeleted === 0
              ? 'manageCourse:no_certificates_deleted'
              : 'manageCourse:certificate_deleted_singular';
          } else {
            successTranslationKey = 'manageCourse:certificates_deleted_plural';
          }

          setSnackbarMessage(t(successTranslationKey, { count: actuallyDeleted }));
          setSnackbarOpen(true);

          // Refetch data to update the table
          setPageIndex(pageIndex); // This triggers a refetch via useTableGrid
        } catch (err) {
          console.error('Certificate deletion error:', err);
          setBulkActionError(err instanceof Error ? err.message : tCommon('error_handling.certificate_deletion_failed'));
        }
      }
    },
    [course.id, createCertificates, removeAchievementCertificates, t, tCommon, setPageIndex, pageIndex]
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
        header: t('lastApplication'),
        accessorKey: 'lastApplication',
        size: 220,
        minSize: 150,
      },
      {
        header: t('status_label'),
        accessorKey: 'status',
        size: 90,
        minSize: 75,
      },
      {
        header: t('ectsTotal'),
        accessorKey: 'ectsTotal',
        size: 90,
        minSize: 75,
        enableSorting: true,
      },
      {
        header: t('attendedEvents'),
        accessorKey: 'attendedEvents',
        size: 180,
        minSize: 120,
        enableSorting: true,
      },
      {
        header: t('certificate'),
        accessorKey: 'certificate',
        accessorFn: (row) => row,
        size: 200,
        minSize: 150,
        cell: ({ getValue }) => (
          <div className="w-full min-w-0 pr-1">
            <CertificateDownload courseEnrollment={getValue<ExtendedDegreeParticipantsEnrollment>()} manageView />
          </div>
        ),
      },
    ],
    [t]
  );

  const participationGroupTitles = useMemo(
    () => ({
      passed: t('participation_groups.passed'),
      attended: t('participation_groups.attended'),
      not_completed: t('participation_groups.not_completed'),
    }),
    [t]
  );

  const expandableDegreeParticipationRow = useCallback(
    ({ row }: { row: ExtendedDegreeParticipantsEnrollment }) => (
      <ExpandableDegreeParticipationRow
        row={row}
        titles={participationGroupTitles}
      />
    ),
    [participationGroupTitles]
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
        sorting={sorting}
        onSortingChange={setSorting}
        error={error}
        loading={loading}
        showCheckbox={true}
        bulkActions={bulkActions}
        onBulkAction={handleBulkAction}
        expandableRowComponent={expandableDegreeParticipationRow}
        refetchQueries={['DegreeParticipantsWithDegreeEnrollments']}
      />
      <NotificationSnackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
      {bulkActionError && (
        <ErrorMessageDialog
          errorMessage={bulkActionError}
          open={!!bulkActionError}
          onClose={() => setBulkActionError(null)}
        />
      )}
    </>
  );
};
