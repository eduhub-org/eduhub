import { FC, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { ManagedCourse_Course_by_pk } from '../../../../queries/__generated__/ManagedCourse';
import TableGrid from '../../../common/TableGrid';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments } from '../../../../queries/__generated__/DegreeParticipantsWithDegreeEnrollments';
import { DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS } from '../../../../queries/courseDegree';
import { CertificateDownload } from '../../../common/CertificateDownload';
import { useTableGrid } from '../../../common/TableGrid/hooks';

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

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0);
  };

  const { data, loading, error, pageIndex, setPageIndex, searchFilter, setSearchFilter } = useTableGrid({
    queryHook: useRoleQuery,
    query: DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS,
    queryVariables: {
      degreeCourseId: course?.id,
    },
    pageSize,
    refetchFilter: (searchFilter) => ({
      filter: {
        User: {
          _or: [{ firstName: { _ilike: `%${searchFilter}%` } }, { lastName: { _ilike: `%${searchFilter}%` } }],
        },
      },
    }),
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

  const columns = useMemo<ColumnDef<ExtendedDegreeParticipantsEnrollment>[]>(
    () => [
      {
        header: t('name'),
        accessorKey: 'name',
        enableSorting: true,
        className: '',
        meta: {
          width: 3,
        },
        cell: ({ getValue }) => <div className="uppercase">{getValue<string>()}</div>,
      },
      {
        header: t('participations'),
        accessorKey: 'participations', // Use the flattened summary string
        meta: {
          width: 4,
        },
        cell: ({ getValue }) => <div style={{ whiteSpace: 'pre-line' }}>{getValue<string>()}</div>, // Display the summary string with multiline support
      },
      {
        header: t('lastApplication'),
        accessorKey: 'lastApplication',
        meta: {
          className: 'text-center',
          width: 1,
        },
      },
      {
        header: t('status'),
        accessorKey: 'status',
        meta: {
          className: 'text-center',
          width: 1,
        },
      },
      {
        header: t('ectsTotal'),
        accessorKey: 'ectsTotal',
        meta: {
          className: 'text-center',
          width: 1,
        },
        enableSorting: true,
      },
      {
        header: t('attendedEvents'),
        accessorKey: 'attendedEvents',
        meta: {
          className: 'text-center',
          width: 1,
        },
      },
      {
        header: t('certificate'),
        accessorKey: 'certificate',
        accessorFn: (row) => row,
        meta: {
          className: 'text-center',
          width: 1,
        },
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
        showCheckbox={false}
        refetchQueries={['DegreeParticipantsWithDegreeEnrollments']}
      />
    </>
  );
};
