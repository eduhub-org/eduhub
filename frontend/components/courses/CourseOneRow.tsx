import { FC } from "react";
import { CourseList_Course } from "../../queries/__generated__/CourseList";
import { MdKeyboardArrowDown } from "react-icons/md";
import { AdminCourseList_Course } from "../../queries/__generated__/AdminCourseList";
interface IProps {
  course: AdminCourseList_Course;
}
const CourseOneRow: FC<IProps> = ({ course }) => {
  return (
    <>
      <tr className="bg-edu-course-list pt-5">
        <td>
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
        <td>
          <div className="flex items-center justify-start ml-5 max-w-xs break-words">
            <p className="text-gray-700 break-words">{course.title}</p>
          </div>
        </td>
        <td className="ml-5">
          <div className="flex items-start">
            <p className="text-sm leading-none text-gray-600 ml-5">
              {course.CourseInstructors.map((instructor) => {
                return (
                  instructor.Expert.User.firstName +
                  " " +
                  (instructor.Expert.User.firstName ?? "</br>")
                );
              })}
            </p>
          </div>
        </td>
        <td>
          <div>
            <p className="text-sm leading-none text-gray-600 ml-5">
              {course.ects}
            </p>
          </div>
        </td>
        <td>
          <div>
            <p className="text-sm leading-none text-gray-600 ml-5">
              {course.status}
            </p>
          </div>
        </td>
        <td>
          <div className="flex items-center">
            <p className="text-sm leading-none text-gray-600 ml-5">
              {course.Program?.shortTitle ?? "-"}
            </p>
          </div>
        </td>
        <td>
          <div className="flex items-center mt-2 mb-2">
            <p className="text-sm leading-none text-gray-600 ml-5">
              {course.endTime ? new Date(course.endTime).toDateString() : ""}
            </p>
            <div className="flex px-5 items-center">
              <button
                className="focus:ring-2 rounded-md focus:outline-none"
                role="button"
                aria-label="option"
              >
                <MdKeyboardArrowDown size={26} />
              </button>
            </div>
          </div>
        </td>
      </tr>
      <tr className="h-1 bg-white" />
    </>
  );
};

export default CourseOneRow;
