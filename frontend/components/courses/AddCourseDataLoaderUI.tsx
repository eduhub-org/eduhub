import { FC } from "react";
import { useAdminQuery } from "../../hooks/authedQuery";
import { COURSE_INSTRUCTOR_LIST } from "../../queries/courseInstructorList";
import {
  CourseInstructorList,
  CourseInstructorList_CourseInstructor,
} from "../../queries/__generated__/CourseInstructorList";
import { Programs_Program } from "../../queries/__generated__/Programs";
import { SelectOption } from "../../types/UIComponents";
import AddCourseForm from "./AddCourseForm";

const makeFullName = (instructor: CourseInstructorList_CourseInstructor) => {
  return (
    instructor.Expert.User.firstName + " " + instructor.Expert.User.lastName
  );
};

const ShortByFirstName = (
  a: CourseInstructorList_CourseInstructor,
  b: CourseInstructorList_CourseInstructor
) => {
  const firstNameA = a.Expert.User.firstName;
  const firstNameB = b.Expert.User.firstName;
  if (firstNameA < firstNameB) {
    return -1;
  }
  if (firstNameA > firstNameB) {
    return 1;
  }
  return 0;
};

interface IProps {
  programs: Programs_Program[];
  refetchCourseList: () => void;
}
const AddCourseDataLoaderUI: FC<IProps> = ({ programs, refetchCourseList }) => {
  const semesters: SelectOption[] = programs.map((program) => ({
    key: program.id,
    label: program.shortTitle ?? program.title,
  }));

  // DB request
  const instructorListRequest = useAdminQuery<CourseInstructorList>(
    COURSE_INSTRUCTOR_LIST
  ); // Load Instructor list from db
  const courseInstructors = [
    ...(instructorListRequest.data?.CourseInstructor || []),
  ];

  if (instructorListRequest.error) {
    console.log(instructorListRequest.error);
  }

  const instructorsSortedByFirstName = courseInstructors.sort(ShortByFirstName);
  const instructorList: SelectOption[] = instructorsSortedByFirstName.map(
    (instructor) => ({
      key: instructor.Expert.id,
      label: makeFullName(instructor),
    })
  );
  if (instructorListRequest.loading) {
    return <h2>Loading</h2>;
  }
  return (
    <>
      {instructorList.length > 0 ? (
        <AddCourseForm
          instructors={instructorList}
          programs={semesters}
          refetchContactList={refetchCourseList}
        />
      ) : (
        <h1>Pleas add instructors first</h1>
      )}
    </>
  );
};

export default AddCourseDataLoaderUI;
