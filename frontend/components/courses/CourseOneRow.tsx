import { IconButton } from "@material-ui/core";
import { FC, useCallback, useState } from "react";
import {
  MdDelete,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from "react-icons/md";
import { useAdminMutation } from "../../hooks/authedMutation";
import { UPDATE_COURSE_PROPERTY } from "../../queries/mutateCourse";
import { CourseListWithFilter_Course } from "../../queries/__generated__/CourseListWithFilter";
import {
  UpdateCourseByPk,
  UpdateCourseByPkVariables,
} from "../../queries/__generated__/UpdateCourseByPk";
import { CourseStatus_enum } from "../../__generated__/globalTypes";
import EhCheckBox from "../common/EhCheckbox";
import CourseDetails from "./CourseDetails";

interface IProps {
  course: CourseListWithFilter_Course;
  handleDelete: (id: number) => void;
  refetchCourseList: () => void;
}

const makeFullName = (firstName: string, lastName: string) =>
  `${firstName} ${lastName}`;

/*  APPLICANTS_INVITED = "APPLICANTS_INVITED",
  DRAFT = "DRAFT",
  PARTICIPANTS_RATED = "PARTICIPANTS_RATED",
  READY_FOR_APPLICATION = "READY_FOR_APPLICATION",
  READY_FOR_PUBLICATION = "READY_FOR_PUBLICATION",
  */
const courseStatuEnumToNumber = (status: string) => {
  switch (status) {
    case CourseStatus_enum.APPLICANTS_INVITED:
      return 1;
    case CourseStatus_enum.DRAFT:
      return 2;
    case CourseStatus_enum.PARTICIPANTS_RATED:
      return 3;
    case CourseStatus_enum.READY_FOR_APPLICATION:
      return 4;
    case CourseStatus_enum.READY_FOR_PUBLICATION:
      return 5;
    default:
      return 0;
  }
};

// EINGELADEN/ BESTÄTIGT/ UNBEWERTET and BEWERB = sum of (EINGELADEN/ BESTÄTIGT/ UNBEWERTET)
// related with courseEnrollment table
// STATUS is related with Cousre - status
// OFF is related with Course Visibility

const CourseOneRow: FC<IProps> = ({
  course,
  handleDelete,
  refetchCourseList,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const [updateCourse] = useAdminMutation<
    UpdateCourseByPk,
    UpdateCourseByPkVariables
  >(UPDATE_COURSE_PROPERTY);

  const onClickDelete = useCallback(() => {
    handleDelete(course.id);
  }, [handleDelete, course.id]);

  const handleArrowClick = useCallback(() => {
    setShowDetails((previous) => !previous);
  }, [setShowDetails]);

  const onChangeVisivity = useCallback(async () => {
    await updateCourse({
      variables: {
        id: course.id,
        visibility: !course.visibility,
      },
    });
    refetchCourseList();
  }, [refetchCourseList, updateCourse, course]);

  return (
    <>
      <tr>
        <td className="bg-edu-course-list">
          <div className="ml-5">
            <div onClick={onChangeVisivity}>
              <EhCheckBox checked={course.visibility ?? false} />
            </div>
          </div>
        </td>
        <td className="bg-edu-course-list">
          <div className="flex items-center justify-start ml-5 max-w-xs break-words">
            <p className="text-gray-700 break-words">{course.title}</p>
          </div>
        </td>
        <td className="bg-edu-course-list ml-5">
          <div className="flex items-start">
            <p className="text-sm leading-none text-gray-600 ml-5">
              {course.CourseInstructors.map((instructor) => {
                return makeFullName(
                  instructor.Expert.User.firstName,
                  instructor.Expert.User.lastName ?? " "
                );
              })}
            </p>
          </div>
        </td>
        <td className="bg-edu-course-list">
          <div>
            <p className="text-sm leading-none text-gray-600 ml-5">
              {course.ects}
            </p>
          </div>
        </td>
        <td className="bg-edu-course-list">
          <div>
            <p className="text-sm leading-none text-gray-600 ml-5">
              {course.status}
            </p>
          </div>
        </td>
        <td className="bg-edu-course-list">
          <div className="flex items-center">
            <p className="text-sm leading-none text-gray-600 ml-5">
              {course.Program?.shortTitle ?? "-"}
            </p>
          </div>
        </td>
        <td className="bg-edu-course-list">
          <div className="flex items-center mt-2 mb-2">
            <p className="text-sm leading-none text-gray-600 ml-5">
              {courseStatuEnumToNumber(course.status)}
            </p>
            <div className="flex px-3 items-center">
              <button
                className="focus:ring-2 rounded-md focus:outline-none"
                role="button"
                aria-label="option"
              >
                {showDetails ? (
                  <MdKeyboardArrowUp size={26} onClick={handleArrowClick} />
                ) : (
                  <MdKeyboardArrowDown size={26} onClick={handleArrowClick} />
                )}
              </button>
            </div>
          </div>
        </td>
        <td>
          <IconButton onClick={onClickDelete}>
            <MdDelete size={24} />
          </IconButton>
        </td>
      </tr>
      <tr className="h-1" />
      {showDetails && <CourseDetails course={course} />}
    </>
  );
};

export default CourseOneRow;
