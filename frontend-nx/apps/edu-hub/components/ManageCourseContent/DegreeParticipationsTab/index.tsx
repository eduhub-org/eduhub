import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ManagedCourse_Course_by_pk } from '../../../queries/__generated__/ManagedCourse';
import { TableGrid } from '../../common/TableGrid';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { DegreeParticipantsWithDegreeEnrollments, DegreeParticipantsWithDegreeEnrollmentsVariables } from '../../../queries/__generated__/DegreeParticipantsWithDegreeEnrollments';
import { DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS } from '../../../queries/courseDegree';
import { CertificateDownload } from '../../common/CertificateDownload';

interface DegreeParticipationsTabIProps {
  course: ManagedCourse_Course_by_pk;
}

export const DegreeParticipationsTab: FC<DegreeParticipationsTabIProps> = ({ course }) => {

  const { lang } = useTranslation();

  const degreeCourseId = course?.id;
  const { data } = useRoleQuery<DegreeParticipantsWithDegreeEnrollments, DegreeParticipantsWithDegreeEnrollmentsVariables>(DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS, {
      variables: { degreeCourseId },
  });
  const degreeParticipantsEnrollments = data?.Course_by_pk?.CourseEnrollments.filter(
    (enrollment) => enrollment.status !== "REJECTED" && enrollment.status !== "APPLIED" && enrollment.status !== "INVITED"
  ) || [];

   // Helper functions for the table columns
   const getMaxUpdatedAt = (courseEnrollments) => {
    if (!courseEnrollments || courseEnrollments.length === 0) {
      return null;
    }
    const maxDate = courseEnrollments
      .map(enrollment => new Date(enrollment.updated_at))
      .reduce((maxDate, currentDate) => (currentDate > maxDate ? currentDate : maxDate));
    return maxDate.toLocaleString(lang);  // Convert the Date object to a string
  };
  
  const getTotalECTS = (courseEnrollments) => {
    if (!courseEnrollments || courseEnrollments.length === 0) {
      return '0';
    }
    const totalEcts = courseEnrollments
      .filter(enrollment => enrollment.achievementCertificateURL)
      .reduce((total, current) => {
        const ects = parseFloat(current.Course.ects.replace(',', '.')) || 0;
        return total + ects;
      }, 0);
      const formattedEcts = totalEcts === 0
      ? totalEcts.toLocaleString(lang, { maximumFractionDigits: 0 })
      : totalEcts.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      return formattedEcts;
    };
    
  const getAttendedEventsCount = (courseEnrollments) => {
    if (!courseEnrollments || courseEnrollments.length === 0) {
      return '0';
    }
    const attendedEventsCount = courseEnrollments
      .filter(enrollment => enrollment.Course.Program.shortTitle === 'EVENTS')
      .length;
    
    return attendedEventsCount;
  };

  const extendedDegreeParticipantsEnrollments = degreeParticipantsEnrollments.map(enrollment => {
    const name = `${enrollment.User.firstName} ${enrollment.User.lastName}`;
    const last_application = getMaxUpdatedAt(enrollment.User.CourseEnrollments) || 'N/A';
    const ects_total = getTotalECTS(enrollment.User.CourseEnrollments);
    const attended_events = getAttendedEventsCount(enrollment.User.CourseEnrollments);
    return {
      ...enrollment,
      name,
      last_application,
      ects_total,
      attended_events,
    };
    });

  // Column definitions
  const columns = [
    {
      columnName: 'name',
      width: 3,
      displayComponent: ({ rowData }) => <div>{rowData?.User.firstName} {rowData?.User.lastName}</div>,
    },
    {
      columnName: 'participations',
      width: 4,
      displayComponent: ({ rowData }) => (
        <div>
          {rowData?.User.CourseEnrollments.map((enrollment, index) => (
                  <span key={index}>
                    {enrollment.Course.title} - {enrollment.Course.Program.shortTitle} ({enrollment.status})
                    <br />
                  </span>
          ))}
        </div>
     ),
      disableSorting: true,
    },
    {
      columnName: 'last_application',
      width: 1,
      className: 'text-center',
      displayComponent: ({ rowData }) => <div>{rowData?.last_application}</div>,
    },
    {
      columnName: 'status',
      width: 1,
      className: 'text-center',
      displayComponent: ({ rowData }) => <div>{rowData?.status}</div>,
    },
    {
      columnName: 'ects_total',
      width: 1,
      className: 'text-center',
      displayComponent: ({ rowData }) => <div>{rowData?.ects_total}</div>,
      sortAsNumber: true,
    },
    {
      columnName: 'attended_events',
      width: 1,
      className: 'text-center',
      displayComponent: ({ rowData }) => <div>{rowData?.attended_events}</div>,
    },
    {
      columnName: 'certificate',
      width: 1,
      className: 'text-center',
      displayComponent: ({ rowData }) => 
        <div>
          <CertificateDownload
            courseEnrollment={rowData}
            manageView
          />
        </div>,
      disableSorting: true,
    },
  ];

  // Render component
  return (
    <TableGrid
      data={extendedDegreeParticipantsEnrollments}
      keyField="id"
      columns={columns}
      showCheckbox={false}
      showDelete={false}
      translationNamespace="manageCourse"
    />
  );
};
