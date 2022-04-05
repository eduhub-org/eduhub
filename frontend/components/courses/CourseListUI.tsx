import { FC, useCallback } from "react";
import { useAdminMutation } from "../../hooks/authedMutation";
import { DELETE_A_COURSE } from "../../queries/mutateCourse";
import { CourseListWithFilter_Course } from "../../queries/__generated__/CourseListWithFilter";
import {
  DeleteCourseByPk,
  DeleteCourseByPkVariables,
} from "../../queries/__generated__/DeleteCourseByPk";
import { Programs_Program } from "../../queries/__generated__/Programs";
import CourseOneRow from "./CourseOneRow";

const tableHeaders: string[] = [
  "Off.",
  "Title",
  "Kursleitung",
  "Bewerb",
  "Eingeladen/ Bestätigt/ Unbewertet",
  "Program",
  "Status",
];

interface IProps {
  programs: Programs_Program[];
  courses: CourseListWithFilter_Course[];
  refetchCourseList: () => void;
}

const CourseListUI: FC<IProps> = ({ programs, courses, refetchCourseList }) => {
  const [deleteACoursByPk] = useAdminMutation<
    DeleteCourseByPk,
    DeleteCourseByPkVariables
  >(DELETE_A_COURSE);

  /* #region handler */
  const handleDelete = useCallback(
    async (courseID: number) => {
      const response = await deleteACoursByPk({
        variables: {
          id: courseID,
        },
      });

      if (response.errors !== undefined) {
        refetchCourseList();
      }
    },
    [deleteACoursByPk, refetchCourseList]
  );

  /* #endregion */
  return (
    <>
      <div className="overflow-x-auto transition-[height]">
        <table className="w-full whitespace-nowrap ">
          <thead>
            <tr className="focus:outline-none h-16 ">
              {tableHeaders.map((text) => {
                return (
                  <th key={text}>
                    <p className="flex justify-start ml-5text-base font-medium leading-none text-gray-700 uppercase">
                      {text}
                    </p>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <CourseOneRow
                key={course.id}
                course={course}
                handleDelete={handleDelete}
                refetchCourseList={refetchCourseList}
                programs={programs}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
export default CourseListUI;
