import { FC } from "react";
import { useAdminQuery } from "../../../hooks/authedQuery";
import { COURSE_LIST } from "../../../queries/courseList";
import { AdminCourseList, AdminCourseListVariables, AdminCourseList_Course } from "../../../queries/__generated__/AdminCourseList";
import { StaticComponentProperty } from "../../../types/UIComponents";
import { Tile } from "../../course/Tile";
import Loading from "../Loading";

interface IProps {
  selectedOption: StaticComponentProperty;
}
const CourseList: FC<IProps> = ({ selectedOption }) => {
  let courses: AdminCourseList_Course[] = [];
  /* #region DB APIs */
  // TODO: Please Come up with valid instructor ID
  const courseListRequest = useAdminQuery<
    AdminCourseList,
    AdminCourseListVariables
  >(COURSE_LIST, {
    variables: {
      where: { CourseInstructors: { expertId: { _eq: 159 } } }
    },
  });
  /* #endregion */

  if (courseListRequest.loading) {
    return <Loading />;
  }

  if (courseListRequest.error) {
    console.log(courseListRequest.error);
    return <></>;
  }

  if (courseListRequest.data?.Course) {
    courses = courseListRequest.data?.Course;
  }

  return (
    <>
      <div>
        <p className="text-base sm:text-lg lg:text-2xl leading-normal text-edu-modal-bg-color">
          {/* {t('pageTitle')} */}
          {selectedOption.label}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-5 py-10">
        {courses.map((course) => (
          // TODO: Url of single course
          <div key={`${course.id}`} className="whitespace-normal">
            <Tile course={course} />
          </div>
        ))}
      </div>
    </>
  );
};

export default CourseList;
