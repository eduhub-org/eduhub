// do not remove this https://github.com/nrwl/nx/issues/9017#issuecomment-1140066503
import path from 'path';
path.resolve('./next.config.js');

import useTranslation from 'next-translate/useTranslation';
import Head from 'next/head';
import ManageCoursesContent from '../../../components/ManageCoursesContent';
import { FC, useCallback, useMemo, useState } from 'react';
import CoursesHeader from '../../../components/ManageCoursesContent/CoursesHeader';
import Loading from '../../../components/common/Loading';
import { Page } from '../../../components/Page';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useIsAdmin, useIsLoggedIn } from '../../../hooks/authentication';
import { ADMIN_COURSE_LIST } from '../../../queries/courseList';
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../../queries/programList';
import { AdminCourseList, AdminCourseListVariables } from '../../../queries/__generated__/AdminCourseList';
import { Programs, Programs_Program } from '../../../queries/__generated__/Programs';

const Index: FC = () => {
  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();
  //const { t } = useTranslation('course-page');
  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">{isLoggedIn && isAdmin && <CoursesDashBoard />}</div>
      </Page>
    </>
  );
};

export default Index;

export const QUERY_LIMIT = 50;

const CoursesDashBoard: FC = () => {
  const programListRequest = useAdminQuery<Programs>(PROGRAMS_WITH_MINIMUM_PROPERTIES); // Load Program list from db

  if (programListRequest.error) {
    console.log(programListRequest.error);
  }
  if (programListRequest.loading) {
    return <Loading />;
  }
  const ps = [...(programListRequest?.data?.Program || [])];
  return ps.length > 0 ? <Content programs={ps} /> : <></>;
};

interface IProps {
  programs: Programs_Program[];
}
const Content: FC<IProps> = ({ programs }) => {
  const sortedPrograms = useMemo(() => {
    return [...programs].sort((a, b) => {
      // Assign specific indices for 'EVENTS' and 'DEGREES'
      const indexA = a.shortTitle === 'EVENTS' ? -2 : a.shortTitle === 'DEGREES' ? -1 : programs.indexOf(a);
      const indexB = b.shortTitle === 'EVENTS' ? -2 : b.shortTitle === 'DEGREES' ? -1 : programs.indexOf(b);
      // Sort based on these indices
      return indexA - indexB;
    });
  }, [programs]);

  const defaultProgram = sortedPrograms.find(
    (program) => program.shortTitle !== 'EVENTS' && program.shortTitle !== 'DEGREES'
  )?.id;
  const { t } = useTranslation('course-page');

  const [filter, setFilter] = useState<AdminCourseListVariables>({
    limit: QUERY_LIMIT,
    offset: 0,
    where: { programId: { _eq: defaultProgram } },
  });

  const courseListRequest = useAdminQuery<AdminCourseList, AdminCourseListVariables>(ADMIN_COURSE_LIST, {
    variables: filter,
  });

  const updateFilter = useCallback(
    (newState: AdminCourseListVariables) => {
      setFilter(newState);
    },
    [setFilter]
  );

  if (courseListRequest.error) {
    console.log(courseListRequest.error);
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <CoursesHeader
        programs={sortedPrograms}
        defaultProgramId={defaultProgram}
        courseListRequest={courseListRequest}
        t={t}
        updateFilter={updateFilter}
        currentFilter={filter}
      />
      {courseListRequest.loading ? (
        <Loading />
      ) : courseListRequest.data?.Course &&
        courseListRequest.data?.Course.length > 0 ? (
        <ManageCoursesContent
          courseListRequest={courseListRequest}
          programs={sortedPrograms}
          t={t}
          updateFilter={updateFilter}
          currentFilter={filter}
        />
      ) : (
        <div className="text-white">
          <p>{t('course-page:no-courses')}</p>
        </div>
      )}
    </div>
  );
};
