import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { QueryResult } from '@apollo/client';
import { ManagedCourse_Course_by_pk } from '../../../queries/__generated__/ManagedCourse';
import { TableGrid } from './TableGrid';
import { useRoleQuery } from 'apps/edu-hub/hooks/authedQuery';
import { DegreeParticipantsWithDegreeEnrollments, DegreeParticipantsWithDegreeEnrollmentsVariables } from '../../../queries/__generated__/DegreeParticipantsWithDegreeEnrollments';
import { DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS } from '../../../queries/courseDegree';

interface DegreeParticipationsTabIProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

export const DegreeParticipationsTab: FC<DegreeParticipationsTabIProps> = ({ course, qResult }) => {

  const { t, lang } = useTranslation('manageCourse');

  const degreeCourseId = course.id;
  const { data } = useRoleQuery<DegreeParticipantsWithDegreeEnrollments, DegreeParticipantsWithDegreeEnrollmentsVariables>(DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS, {
      variables: { degreeCourseId },
  });
  const degreeParticipantsEnrollments = data?.Course_by_pk?.CourseEnrollments || [];

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
  // const sortMaxUpdatedAt = (a, b, columnName, sortDirection) => {
  //   const valueA = getMaxUpdatedAt(a.User.CourseEnrollments);
  //   const valueB = getMaxUpdatedAt(b.User.CourseEnrollments);
  //   if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
  //   if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
  //   return 0; 
  // };
  
  const getTotalECTS = (courseEnrollments) => {
    if (!courseEnrollments || courseEnrollments.length === 0) {
      return '0';
    }
    const totalEcts = courseEnrollments
      .filter(enrollment => enrollment.certificateAchievementURL)
      .reduce((total, current) => {
        const ects = parseFloat(current.Course.ects.replace(',', '.'));
        return total + ects;
      }, 0);
  
    return totalEcts.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
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

  // Column definitions
  const columns = [
    {
      columnName: 'name',
      width: 2,
      displayComponent: ({ rowData }) => <div>{rowData?.User.firstName} {rowData.User.lastName}</div>,
    },
    {
      columnName: 'participations',
      width: 4,
      displayComponent: ({ rowData }) => (
        <div>
          {rowData?.User.CourseEnrollments.map((enrollment, index) => (
           <span key={index}>
              {enrollment.Course.title} - {enrollment.Course.Program.shortTitle} ({enrollment.status})
             {index < rowData?.User.CourseEnrollments.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      ),
    },
    {
      columnName: 'last_application',
      width: 1,
      className: 'text-center',
      displayComponent: ({ rowData }) => <div>{getMaxUpdatedAt(rowData.User.CourseEnrollments) || 'N/A'}</div>,
      sortFunction: getMaxUpdatedAt,
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
      displayComponent: ({ rowData }) => <div>{getTotalECTS( rowData.User.CourseEnrollments)}</div>,
    },
    {
      columnName: 'attended_events',
      width: 1,
      className: 'text-center',
      displayComponent: ({ rowData }) => <div>{getAttendedEventsCount(rowData.User.CourseEnrollments)}</div>,
    },
  ];

  // Render component
  return (
    <TableGrid
      data={degreeParticipantsEnrollments}
      keyField="id"
      columns={columns}
      showCheckbox={false}
      showDelete={false}
    />
  );
};
