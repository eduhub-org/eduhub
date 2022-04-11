import { FC } from "react";
import { useAdminQuery } from "../../../hooks/authedQuery";
import { COURSE_LIST_FOR_SINGLE_INSTRUCTOR } from "../../../queries/courseList";
import {
  CoursesSingleInstructor,
  CoursesSingleInstructorVariables,
  CoursesSingleInstructor_Course,
} from "../../../queries/__generated__/CoursesSingleInstructor";
import { StaticComponentProperty } from "../../../types/UIComponents";
import { Tile } from "../../course/Tile";
import Loading from "../Loading";

interface IProps {
  selectedOption: StaticComponentProperty;
}
const CourseList: FC<IProps> = ({ selectedOption }) => {
  let courses: CoursesSingleInstructor_Course[] = [];
  /* #region DB APIs */
  // TODO: Please Come up with valid instructor ID
  const courseListRequest = useAdminQuery<
    CoursesSingleInstructor,
    CoursesSingleInstructorVariables
  >(COURSE_LIST_FOR_SINGLE_INSTRUCTOR, {
    variables: {
      expertId: 159,
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
