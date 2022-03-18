import { Button, IconButton } from "@material-ui/core";
import { FC, useCallback, useState } from "react";
import { MdDelete, MdKeyboardArrowDown, MdRemove } from "react-icons/md";
import { CourseListWithFilter_Course } from "../../queries/__generated__/CourseListWithFilter";
import { CourseStatus_enum } from "../../__generated__/globalTypes";
import CourseDetails from "./CourseDetails";

interface IProps {
  course: CourseListWithFilter_Course;
  handleDelete: (id: number) => void;
}

// EINGELADEN/ BESTÄTIGT/ UNBEWERTET and BEWERB = sum of (EINGELADEN/ BESTÄTIGT/ UNBEWERTET)
// related with courseEnrollment table
// STATUS is related with Cousre - status
// OFF is related with Course Visibility

const makeFullName = (firstName: string, lastName: string) =>
  `${firstName} ${lastName}`;

const CourseOneRow: FC<IProps> = ({ course, handleDelete }) => {
  const [showDetails, setShowDetails] = useState(false);

  const onClickDelete = useCallback(() => {
    handleDelete(course.id);
  }, [handleDelete, course.id]);

  const handleArrowClick = useCallback(() => {
    setShowDetails((previous) => !previous);
  }, []);
  return (
    <>
      <tr>
        <td className="bg-edu-course-list">
          <div className="ml-5">
            <div className="bg-gray-200 rounded-sm w-5 h-5 flex flex-shrink-0 justify-center items-center relative">
              <input
                placeholder="checkbox"
                type="checkbox"
                className="focus:opacity-100 checkbox opacity-0 absolute cursor-pointer w-full h-full"
              />
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
              {course.endTime ? new Date(course.endTime).toDateString() : ""}
            </p>
            <div className="flex px-3 items-center">
              <button
                className="focus:ring-2 rounded-md focus:outline-none"
                role="button"
                aria-label="option"
              >
                <MdKeyboardArrowDown size={26} onClick={handleArrowClick} />
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
