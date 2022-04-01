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

const convertToILikeFilter = (input: string) => `%${input}%`;

interface IProps {
  programs: Programs_Program[];
}
const CoursesDashBoard: FC<IProps> = ({ programs }) => {
  const defaultProgram =
    programs.length > 0 && programs[0].shortTitle ? programs[0].shortTitle : "";
  // State variables
  const [courseFilter, setCourseFilter] = useState({
    courseTitle: "",
    programShortTitle: defaultProgram,
  });

  const courseListRequest = useAdminQuery<
    CourseListWithFilter,
    CourseListWithFilterVariables
  >(COURSE_LIST_WITH_FILTER, {
    // variables: courseFilter, // state variable not rendering instantly
    variables: {
      courseTitle: convertToILikeFilter(""),
      programShortTitle: convertToILikeFilter(defaultProgram),
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
      courseListRequest.refetch({
        courseTitle: convertToILikeFilter(prev.courseTitle),
        programShortTitle: convertToILikeFilter(prev.programShortTitle),
      });
      return prev;
    });
  }, [setCourseFilter, courseListRequest]);

  const handleSemesterTabClick = useCallback(
    (tabID: string) => {
      setCourseFilter((prev) => {
        courseListRequest.refetch({
          courseTitle: convertToILikeFilter(prev.courseTitle),
          programShortTitle: convertToILikeFilter(tabID.trim()),
        });
        return { ...prev, programShortTitle: tabID.trim() };
      });
    },
    [setCourseFilter, courseListRequest]
  );

  const handleSearchInCourseTitle = useCallback(
    (searchedText: string) => {
      setCourseFilter((prev) => {
        courseListRequest.refetch({
          courseTitle: convertToILikeFilter(searchedText),
          programShortTitle: convertToILikeFilter(prev.programShortTitle),
        });
        return { ...prev, courseTitle: searchedText };
      });
    },
    [setCourseFilter, courseListRequest]
  );

  /* #endregion */
  return (
    <div>
      <div className="sm:px-0 w-full">
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
