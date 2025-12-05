import { FC, ReactNode, useMemo, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';

import { useAdminQuery } from '../../../hooks/authedQuery';
import { EXPERTS_BY_LAST_NAME } from '../../../queries/experts';
import { ExpertsByLastName_User } from '../../../queries/__generated__/ExpertsByLastName';
import { PageBlock } from '../../common/PageBlock';
import CommonPageHeader from '../../common/CommonPageHeader';

interface ExpertRole {
  type: 'instructor' | 'speaker';
  courseTitle: string;
  programShortTitle: string;
  sessionTitle?: string;
}

const ExpandableExpertRow: FC<{ row: ExpertsByLastName_User }> = ({ row }) => {
  const { t } = useTranslation('manageExperts');

  // Collect all roles for this user
  const roles: ExpertRole[] = useMemo(() => {
    const result: ExpertRole[] = [];

    // Add instructor roles
    row.CourseInstructors?.forEach((ci) => {
      if (ci.Course) {
        result.push({
          type: 'instructor',
          courseTitle: ci.Course.title,
          programShortTitle: ci.Course.Program?.shortTitle || '',
        });
      }
    });

    // Add speaker roles
    row.SessionSpeakers?.forEach((ss) => {
      if (ss.Session?.Course) {
        result.push({
          type: 'speaker',
          courseTitle: ss.Session.Course.title,
          programShortTitle: ss.Session.Course.Program?.shortTitle || '',
          sessionTitle: ss.Session.title,
        });
      }
    });

    return result;
  }, [row.CourseInstructors, row.SessionSpeakers]);

  if (roles.length === 0) {
    return (
      <div className="bg-edu-course-list p-4">
        <p className="text-gray-600 text-sm">{t('no_roles')}</p>
      </div>
    );
  }

  return (
    <div className="bg-edu-course-list">
      <div className="grid grid-cols-12 gap-2 p-2 font-medium text-gray-700 border-b border-gray-200">
        <div className="col-span-4 pl-3">{t('course')}</div>
        <div className="col-span-2">{t('program')}</div>
        <div className="col-span-3">{t('role')}</div>
        <div className="col-span-3">{t('session')}</div>
      </div>
      {roles.map((role, index) => (
        <div
          key={index}
          className="grid grid-cols-12 gap-2 p-2 text-gray-600 text-sm border-b border-gray-100 last:border-b-0"
        >
          <div className="col-span-4 pl-3 truncate" title={role.courseTitle}>
            {role.courseTitle}
          </div>
          <div className="col-span-2 truncate">{role.programShortTitle}</div>
          <div className="col-span-3">
            {role.type === 'instructor' ? t('role_instructor') : t('role_speaker')}
          </div>
          <div className="col-span-3 truncate" title={role.sessionTitle || ''}>
            {role.sessionTitle || '-'}
          </div>
        </div>
      ))}
    </div>
  );
};

const ManageExpertsContent: FC = () => {
  const { t } = useTranslation('manageExperts');
  const [pageSize, setPageSize] = useState(20);

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0);
  };

  const { data, loading, error, pageIndex, setPageIndex, searchFilter, setSearchFilter } = useTableGrid({
    queryHook: useAdminQuery,
    query: EXPERTS_BY_LAST_NAME,
    pageSize: pageSize,
    refetchFilter: (searchFilter) => {
      const searchCondition = createMultiWordSearchCondition(searchFilter, [
        'lastName',
        'firstName',
        'email',
        // Instructor course fields
        'CourseInstructors.Course.title',
        'CourseInstructors.Course.tagline',
        'CourseInstructors.Course.contentDescriptionField1',
        'CourseInstructors.Course.contentDescriptionField2',
        'CourseInstructors.Course.headingDescriptionField1',
        'CourseInstructors.Course.headingDescriptionField2',
        // Session speaker fields
        'SessionSpeakers.Session.title',
        'SessionSpeakers.Session.description',
        'SessionSpeakers.Session.Course.title',
      ]);
      return {
        filter: searchCondition,
      };
    },
  });

  const columns = useMemo<ColumnDef<ExpertsByLastName_User>[]>(
    () => [
      {
        header: t('first_name'),
        accessorKey: 'firstName',
        enableSorting: true,
        size: 300,
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
      {
        header: t('last_name'),
        accessorKey: 'lastName',
        enableSorting: true,
        size: 300,
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
      {
        header: t('email'),
        accessorKey: 'email',
        enableSorting: true,
        size: 300,
        cell: ({ getValue }) => <div>{getValue<ReactNode>()}</div>,
      },
    ],
    [t]
  );

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">
        {loading && <Loading />}
        {!loading && !error && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <CommonPageHeader headline={t('headline')} />
            </div>
            <TableGrid
              columns={columns}
              data={data?.User || []}
              totalCount={data?.User_aggregate?.aggregate?.count || 0}
              pageIndex={pageIndex}
              onPageChange={setPageIndex}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              searchFilter={searchFilter}
              onSearchFilterChange={setSearchFilter}
              error={error}
              loading={loading}
              refetchQueries={['ExpertsByLastName']}
              expandableRowComponent={({ row }) => <ExpandableExpertRow row={row} />}
            />
          </div>
        )}
      </div>
    </PageBlock>
  );
};

export default ManageExpertsContent;

