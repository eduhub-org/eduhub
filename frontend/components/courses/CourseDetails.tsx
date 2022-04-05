import { Button } from "@material-ui/core";
import { FC, useCallback, useState } from "react";
import { MdUploadFile } from "react-icons/md";
import { useAdminMutation } from "../../hooks/authedMutation";
import { UPDATE_COURSE_PROPERTY } from "../../queries/mutateCourse";
import { CourseListWithFilter_Course } from "../../queries/__generated__/CourseListWithFilter";
import { Course_set_input } from "../../__generated__/globalTypes";
import EhCheckBox from "../common/EhCheckbox";
import {
  UpdateCourseByPk,
  UpdateCourseByPkVariables,
} from "../../queries/__generated__/UpdateCourseByPk";
import EhTagEditTag from "../common/EhTagEditTag";
import {
  DeleteCourseInstructor,
  DeleteCourseInstructorVariables,
} from "../../queries/__generated__/DeleteCourseInstructor";
import { DELETE_COURSE_INSRTRUCTOR } from "../../queries/mutateCourseInstructor";

const makeFullName = (firstName: string, lastName: string) =>
  `${firstName} ${lastName}`;

interface IPros {
  course: CourseListWithFilter_Course;
  refetchCourseList: () => void;
}

const CourseDetails: FC<IPros> = ({ course, refetchCourseList }) => {
  const [updateCourseQuery] = useAdminMutation<
    UpdateCourseByPk,
    UpdateCourseByPkVariables
  >(UPDATE_COURSE_PROPERTY);

  const [deleteInstructorAPI] = useAdminMutation<
    DeleteCourseInstructor,
    DeleteCourseInstructorVariables
  >(DELETE_COURSE_INSRTRUCTOR);

  const updateCourse = (input: Course_set_input) => async () => {
    const response = await updateCourseQuery({
      variables: {
        id: course.id,
        changes: input,
      },
    });

    if (!response.errors) {
      refetchCourseList();
    }
  };

  /* #region Callbacks */

  const deleteInstructorFromACourse = useCallback(
    async (id: number) => {
      const response = await deleteInstructorAPI({
        variables: {
          courseId: course.id,
          expertId: id,
        },
      });

      if (response.errors) {
        return;
      }
      refetchCourseList();
    },
    [deleteInstructorAPI, refetchCourseList, course]
  );
  /** #endregion */

  return (
    <>
      <tr className="bg-edu-course-list">
        <td className="ml-5" colSpan={1} />
        <td className="ml-5 content-start my-8" colSpan={1}>
          <div className="bg-white p-2 mr-5 h-32 justify-end mb-2">
            <Button
              className="absolute b-0 r-0"
              endIcon={<MdUploadFile />}
              variant="outlined"
            >
              {" "}
              Upload
            </Button>
          </div>
        </td>
        <td className="inline-block align-top pb-2" colSpan={1}>
          <div className="flex flex-col space-y-1">
            {
              // Show the all instructors but first one
              course.CourseInstructors.map(
                (courseIn, index) =>
                  index > 0 && (
                    <EhTagEditTag
                      key={`${course.id}-${courseIn.Expert.id}-${index}`}
                      requestDeleteTag={deleteInstructorFromACourse}
                      tag={{
                        display: makeFullName(
                          courseIn.Expert.User.firstName,
                          courseIn.Expert.User.lastName ?? ""
                        ),
                        id: courseIn.Expert.id,
                      }}
                    />
                  )
              )
            }
          </div>
        </td>
        <td className="ml-10" colSpan={4}>
          <div className="flex flex-col space-y-2 mb-2">
            {course.chatLink && (
              <div>
                <label htmlFor="" className="uppercase">
                  {" "}
                  Live Chat{" "}
                </label>
                <p className="bg-white w-3/5 p-2 text-ellipsis overflow-hidden">
                  {
                    <a className="" href={course.chatLink}>
                      {course.chatLink}
                    </a>
                  }
                </p>
              </div>
            )}
            <div className="flex flex-row space-x-4">
              <label htmlFor="">Mögliche Bescheinigungen:</label>
              <label htmlFor=""> {course.ects} </label>
            </div>
            <div className="flex flex-col space-y-2 w-1/3">
              <div
                onClick={updateCourse({
                  attendanceCertificatePossible: !course.attendanceCertificatePossible,
                })}
              >
                <EhCheckBox
                  checked={course.attendanceCertificatePossible}
                  text="Teilnahmenachweis"
                />
              </div>
              <div
                onClick={updateCourse({
                  achievementCertificatePossible: !course.achievementCertificatePossible,
                })}
              >
                <EhCheckBox
                  checked={course.achievementCertificatePossible}
                  text="Leistungszertifikat"
                />
              </div>
            </div>
          </div>
        </td>
      </tr>
      <tr className="h-1" />
    </>
  );
};

export default CourseDetails;
