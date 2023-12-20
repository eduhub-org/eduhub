import { FC, useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ColumnDef } from '@tanstack/react-table';
import { ManagedCourse_Course_by_pk } from '../../../queries/__generated__/ManagedCourse';
import TableGrid from '../../common/TableGrid';
import { useRoleQuery } from '../../../hooks/authedQuery';
import {
  DegreeParticipantsWithDegreeEnrollments,
  DegreeParticipantsWithDegreeEnrollmentsVariables,
  DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments,
  DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments_User_CourseEnrollments,
} from '../../../queries/__generated__/DegreeParticipantsWithDegreeEnrollments';
import { DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS } from '../../../queries/courseDegree';
import { CertificateDownload } from '../../common/CertificateDownload';

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
  const { lang } = useTranslation();

  const degreeCourseId = course?.id;
  const { data } = useRoleQuery<
    DegreeParticipantsWithDegreeEnrollments,
    DegreeParticipantsWithDegreeEnrollmentsVariables
  >(DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS, {
    variables: { degreeCourseId },
  });
  const degreeParticipantsEnrollments =
    data?.Course_by_pk?.CourseEnrollments.filter(
      (enrollment) =>
        enrollment.status !== 'REJECTED' && enrollment.status !== 'APPLIED' && enrollment.status !== 'INVITED'
    ) || [];

  // Helper functions for the table columns
  const getMaxUpdatedAt = (courseEnrollments) => {
    if (!courseEnrollments || courseEnrollments.length === 0) {
      return null;
    }
    const maxDate = courseEnrollments
      .map((enrollment) => new Date(enrollment.updated_at))
      .reduce((maxDate, currentDate) => (currentDate > maxDate ? currentDate : maxDate));
    return maxDate.toLocaleString(lang); // Convert the Date object to a string
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
        ? totalEcts.toLocaleString(lang, { maximumFractionDigits: 0 })
        : totalEcts.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
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

  const extendedDegreeParticipantsEnrollments: ExtendedDegreeParticipantsEnrollment[] =
    degreeParticipantsEnrollments.map((enrollment) => {
      const name = `${enrollment.User.firstName} ${enrollment.User.lastName}`;
      const lastApplication = getMaxUpdatedAt(enrollment.User.CourseEnrollments) || 'N/A';
      const ectsTotal = getTotalECTS(enrollment.User.CourseEnrollments);
      const attendedEvents = getAttendedEventsCount(enrollment.User.CourseEnrollments);
      const participations = enrollment.User.CourseEnrollments.map(
        (ce) => `${ce.Course.title} (${ce.Course.Program.shortTitle})`
      ).join(', '); // Flatten array of enrollments into a summary string

      return {
        ...enrollment,
        name,
        lastApplication,
        ectsTotal,
        attendedEvents,
        participations, // Include the flattened summary string
      };
    });

  const columns = useMemo<ColumnDef<ExtendedDegreeParticipantsEnrollment>[]>(
    () => [
      {
        accessorKey: 'name',
        enableSorting: true,
        className: '',
        meta: {
          width: 3,
        },
        cell: ({ getValue }) => <div className="uppercase">{getValue<string>()}</div>,
      },
      {
        accessorKey: 'participations', // Use the flattened summary string
        meta: {
          width: 4,
        },
        cell: ({ getValue }) => <div>{getValue<string>()}</div>, // Display the summary string
      },
      {
        accessorKey: 'lastApplication',
        meta: {
          className: 'text-center',
          width: 1,
        },
      },
      {
        accessorKey: 'status',
        meta: {
          className: 'text-center',
          width: 1,
        },
      },
      {
        accessorKey: 'ectsTotal',
        meta: {
          className: 'text-center',
          width: 1,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'attendedEvents',
        meta: {
          className: 'text-center',
          width: 1,
        },
      },
      {
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
    []
  );

  // Render component
  return (
    <>
      <TableGrid
        data={extendedDegreeParticipantsEnrollments}
        columns={columns}
        showCheckbox={false}
        showDelete={false}
        translationNamespace="manageCourse"
      />
    </>
  );
};
