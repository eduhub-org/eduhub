import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { QueryResult } from '@apollo/client';
import { ManagedCourse_Course_by_pk } from '../../../queries/__generated__/ManagedCourse';
import { TableGrid } from './TableGrid';

interface DegreeParticipationsTabIProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

export const DegreeParticipationsTab: FC<DegreeParticipationsTabIProps> = ({ course, qResult }) => {

  const { t } = useTranslation('manageCourse');

  const degreeParticipantsEnrollments = course.CourseEnrollments;

  

  const data = degreeParticipantsEnrollments;
  const columns = [
    {
      columnName: 'Name',
      width: 2,
      displayComponent: ({ rowData }) => <div>{rowData.User.firstName} {rowData.User.lastName}</div>,
    },
    {
      columnName: 'Participations',
      width: 4,
      displayComponent: ({ rowData }) => <div>Data2{rowData.title}</div>,
    },
    {
      columnName: 'Last Participation',
      width: 1,
      displayComponent: ({ rowData }) => <div>Data 3{rowData.title}</div>,
    },
    {
      columnName: 'Status',
      width: 2,
      displayComponent: ({ rowData }) => <div>{rowData.status}</div>,
    },
  ];

  // Render component
  return (
    <TableGrid
      data={data}
      keyField="id"
      columns={columns}
      showCheckbox={false}
      showDelete={false}
    />
  );
};
