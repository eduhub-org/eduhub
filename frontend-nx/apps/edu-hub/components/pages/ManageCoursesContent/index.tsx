/* eslint-disable @typescript-eslint/ban-ts-comment */
import { FC, useCallback, useMemo, useState } from 'react';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import { CircularProgress } from '@material-ui/core';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { useRoleQuery } from '../../../hooks/authedQuery';

import { QUERY_LIMIT } from '../../../pages/manage/courses';
import { AdminCourseListVariables, AdminCourseList_Course } from '../../../queries/__generated__/AdminCourseList';
import { Programs_Program } from '../../../queries/__generated__/Programs';
import SingleCourseRow from './SingleCourseRow';
import {
  UPDATE_COURSE_ACHIEVEMENT_CERTIFICATE_POSSIBLE,
  UPDATE_COURSE_ATTENDANCE_CERTIFICATE_POSSIBLE,
  UPDATE_COURSE_TITLE,
} from '../../../queries/course';
import {
  UpdateCourseAttendanceCertificatePossible,
  UpdateCourseAttendanceCertificatePossibleVariables,
} from '../../../queries/__generated__/UpdateCourseAttendanceCertificatePossible';
import {
  UpdateCourseAchievementCertificatePossible,
  UpdateCourseAchievementCertificatePossibleVariables,
} from '../../../queries/__generated__/UpdateCourseAchievementCertificatePossible';
import { UpdateCourseTitle, UpdateCourseTitleVariables } from '../../../queries/__generated__/UpdateCourseTitle';
import { DEGREE_COURSES } from '../../../queries/courseDegree';
import { DegreeCourses } from '../../../queries/__generated__/DegreeCourses';

import { Translate } from 'next-translate';

interface IProps {
  t: Translate;
  programs: Programs_Program[];
  courseListRequest: any;
  updateFilter: (newState: AdminCourseListVariables) => void;
  currentFilter: AdminCourseListVariables;
}
const ManageCoursesContent: FC<IProps> = ({ courseListRequest, programs, t, updateFilter, currentFilter }) => {
  if (courseListRequest.error) {
    console.log('query programs error', courseListRequest.error);
  }

  const tableHeaders: [string, string][] = [
    [t('table-header-published'), 'justify-center'],
    [t('table-header-title'), 'justify-start'],
    [t('table-header-instructor'), 'justify-start'],
    [t('table-header-applications'), 'justify-center'],
    [t('table-header-application-status'), 'justify-center'],
    [t('table-header-program'), 'justify-center'],
    [t('table-header-status'), 'justify-center'],
  ];
  const courses: AdminCourseList_Course[] = [...(courseListRequest.data?.Course ?? [])];
  const refetchCourses = useCallback(() => {
    courseListRequest.refetch();
  }, [courseListRequest]);

  const count = courseListRequest.data?.Course_aggregate?.aggregate?.count || 0;

  const [updateAttendanceCertificatePossible] = useAdminMutation<
    UpdateCourseAttendanceCertificatePossible,
    UpdateCourseAttendanceCertificatePossibleVariables
  >(UPDATE_COURSE_ATTENDANCE_CERTIFICATE_POSSIBLE);
  const handleAttendanceCertificatePossible = useCallback(
    async (c: AdminCourseList_Course, isPossible: boolean) => {
      await updateAttendanceCertificatePossible({
        variables: {
          courseId: c.id,
          isPossible,
        },
      });
      courseListRequest.refetch();
    },
    [courseListRequest, updateAttendanceCertificatePossible]
  );

  const [updateAchievementCertificatePossible] = useAdminMutation<
    UpdateCourseAchievementCertificatePossible,
    UpdateCourseAchievementCertificatePossibleVariables
  >(UPDATE_COURSE_ACHIEVEMENT_CERTIFICATE_POSSIBLE);
  const handleAchievementCertificatePossible = useCallback(
    async (c: AdminCourseList_Course, isPossible: boolean) => {
      await updateAchievementCertificatePossible({
        variables: {
          courseId: c.id,
          isPossible,
        },
      });
      courseListRequest.refetch();
    },
    [courseListRequest, updateAchievementCertificatePossible]
  );

  const [updateTitle] = useAdminMutation<UpdateCourseTitle, UpdateCourseTitleVariables>(UPDATE_COURSE_TITLE);
  const handleTitle = useCallback(
    async (c: AdminCourseList_Course, title: string) => {
      await updateTitle({
        variables: {
          courseId: c.id,
          courseTitle: title,
        },
      });
      courseListRequest.refetch();
    },
    [courseListRequest, updateTitle]
  );

  const courseGroupOptions = useMemo(() => {
    if (courseListRequest.data && !courseListRequest.loading && !courseListRequest.error) {
      return (
        courseListRequest.data.CourseGroupOption?.map((option) => ({
          id: option.id,
          name: t(option.title),
        })) || []
      );
    } else {
      return [];
    }
  }, [t, courseListRequest]);

  const degreeCoursesQuery = useRoleQuery<DegreeCourses>(DEGREE_COURSES);
  const degreeCourses = useMemo(() => {
    if (degreeCoursesQuery.data && !degreeCoursesQuery.loading && !degreeCoursesQuery.error) {
      return degreeCoursesQuery.data.Course.map((course) => ({
        id: course.id,
        name: course.title,
      }));
    } else {
      return [];
    }
  }, [degreeCoursesQuery.data, degreeCoursesQuery.loading, degreeCoursesQuery.error]);

  return (
    <>
      <div className="flex flex-col space-y-10">
        <div className="overflow-x-auto transition-[height]">
          {courseListRequest.loading ? (
            <CircularProgress />
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  {tableHeaders.map((header, index) => {
                    const [text, className] = header;
                    return (
                      <th key={text} className="py-2 px-5">
                        <p className={`flex ${className} font-medium text-gray-400 uppercase`}>{text}</p>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <SingleCourseRow
                    key={course.id}
                    course={course}
                    programs={programs}
                    courseGroupOptions={courseGroupOptions}
                    degreeCourses={degreeCourses}
                    refetchCourses={refetchCourses}
                    onSetAttendanceCertificatePossible={handleAttendanceCertificatePossible}
                    onSetAchievementCertificatePossible={handleAchievementCertificatePossible}
                    onSetTitle={handleTitle}
                    qResult={courseListRequest}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
        {count > QUERY_LIMIT && (
          <Pagination
            courseListRequest={courseListRequest}
            programs={programs}
            updateFilter={updateFilter}
            currentFilter={currentFilter}
            t={t}
            count={count}
          />
        )}
      </div>
    </>
  );
};

export default ManageCoursesContent;

/* #region Pagination */
interface IPageProps extends IProps {
  count: number;
}

const Pagination: FC<IPageProps> = ({ t, courseListRequest, count, updateFilter }) => {
  const limit = QUERY_LIMIT;
  const pages = Math.ceil(count / QUERY_LIMIT);
  const [current_page, setCurrentPage] = useState(1);

  const calculateOffset = useCallback(
    (pageNumber: number) => {
      if (count <= limit) return 0;
      return pageNumber * limit - limit;
    },
    [limit, count]
  );

  const handlePrevious = useCallback(() => {
    setCurrentPage((prev) => {
      const currentPage = prev - 1;
      courseListRequest.refetch({
        ...courseListRequest.variables,
        offset: calculateOffset(currentPage),
      });
      return currentPage;
    });
  }, [setCurrentPage, calculateOffset, courseListRequest]);

  const handleNext = useCallback(() => {
    setCurrentPage((prev) => {
      const currentPage = prev + 1;
      courseListRequest.refetch({
        ...courseListRequest.variables,
        offset: calculateOffset(currentPage),
      });
      return currentPage;
    });
  }, [setCurrentPage, courseListRequest, calculateOffset]);

  return (
    <div className="flex justify-end pb-10">
      <div className="flex flex-row space-x-5">
        {current_page > 1 && (
          <MdArrowBack
            className="border-2 rounded-full cursor-pointer hover:bg-edu-black hover:text-white bg-white"
            size={40}
            onClick={handlePrevious}
          />
        )}
        <p className="font-medium">
          {/* @ts-ignore */}
          {t('paginationText', { currentPage: current_page, totalPage: pages })}
        </p>

        {current_page < pages && (
          <MdArrowForward
            className="border-2 rounded-full cursor-pointer hover:bg-edu-black hover:text-white bg-white"
            size={40}
            onClick={handleNext}
          />
        )}
      </div>
    </div>
  );
};
/* #endregion */
