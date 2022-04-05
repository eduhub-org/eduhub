import { FC, useCallback, useState } from "react";
import { useAdminQuery } from "../../hooks/authedQuery";
import { COURSE_LIST_WITH_FILTER } from "../../queries/courseList";
import {
  CourseListWithFilter,
  CourseListWithFilterVariables,
  CourseListWithFilter_Course,
} from "../../queries/__generated__/CourseListWithFilter";
import { Programs_Program } from "../../queries/__generated__/Programs";
import CourseListHeader from "./CourseListHeader";
import CourseListUI from "./CourseListUI";
import Loading from "./Loading";

const convertToILikeFilter = (input: string) => `%${input}%`;

const createWhereClauseForCourse = (courseTitle: string, programId: number) => {
  if (courseTitle.trim().length === 0 && programId < 0) {
    return {
      whereAndClause: [],
    };
  }
  if (courseTitle.trim().length === 0 && programId >= 0) {
    return {
      whereAndClause: [{ programId: { _eq: programId } }],
    };
  }
  if (courseTitle.trim().length > 0 && programId < 0) {
    return {
      whereAndClause: [
        { title: { _ilike: convertToILikeFilter(courseTitle) } },
      ],
    };
  }
  return {
    whereAndClause: [
      { title: { _ilike: convertToILikeFilter(courseTitle) } },
      { programId: { _eq: programId } },
    ],
  };
};

interface IProps {
  programs: Programs_Program[];
}
const CoursesDashBoard: FC<IProps> = ({ programs }) => {
  const defaultProgram = programs[0].id;
  // State variables
  const [courseFilter, setCourseFilter] = useState({
    courseTitle: "",
    programId: defaultProgram,
  });

  const courseListRequest = useAdminQuery<
    CourseListWithFilter,
    CourseListWithFilterVariables
  >(COURSE_LIST_WITH_FILTER, {
    // variables: courseFilter, // state variable not rendering instantly
    variables: {
      whereAndClause: [{ programId: { _eq: defaultProgram } }],
    },
  });

  if (courseListRequest.error) {
    console.log(courseListRequest.error);
  }

  const courses: CourseListWithFilter_Course[] = [
    ...(courseListRequest.data?.Course ?? []),
  ];

  /* #region callbacks */
  const handleRefetchRequest = useCallback(() => {
    setCourseFilter((prev) => {
      courseListRequest.refetch(
        createWhereClauseForCourse(prev.courseTitle, prev.programId)
      );
      return prev;
    });
  }, [setCourseFilter, courseListRequest]);

  const handleSemesterTabClick = useCallback(
    (tabID: number) => {
      setCourseFilter((prev) => {
        courseListRequest.refetch(
          createWhereClauseForCourse(prev.courseTitle, tabID)
        );
        return { ...prev, programId: tabID };
      });
    },
    [setCourseFilter, courseListRequest]
  );

  const handleSearchInCourseTitle = useCallback(
    (searchedText: string) => {
      setCourseFilter((prev) => {
        courseListRequest.refetch(
          createWhereClauseForCourse(searchedText, prev.programId)
        );
        return { ...prev, courseTitle: searchedText };
      });
    },
    [setCourseFilter, courseListRequest]
  );

  if (courseListRequest.loading) {
    return <Loading />;
  }
  /* #endregion */
  return (
    <div>
      <div className="w-full">
        <CourseListHeader
          programs={programs}
          filterOptions={courseFilter}
          onSearchTitle={handleSearchInCourseTitle}
          onTabClicked={handleSemesterTabClick}
          refetchCourseList={handleRefetchRequest}
        />
        {courses.length > 0 && (
          <CourseListUI
            courses={courses}
            programs={programs}
            refetchCourseList={handleRefetchRequest}
          />
        )}
      </div>
    </div>
  );
};

export default CoursesDashBoard;
