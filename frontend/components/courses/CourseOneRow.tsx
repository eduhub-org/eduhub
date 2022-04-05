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
import { Programs_Program } from "../../queries/__generated__/Programs";
import {
  UpdateCourseByPk,
  UpdateCourseByPkVariables,
} from "../../queries/__generated__/UpdateCourseByPk";
import { SelectOption } from "../../types/UIComponents";
import {
  CourseEnrollmentStatus_enum,
  CourseStatus_enum,
} from "../../__generated__/globalTypes";
import EhCheckBox from "../common/EhCheckbox";
import EhSelect from "../common/EhSelect";
import CourseDetails from "./CourseDetails";
import InstructorInARow from "./InstructorInARow";

/* #region Local Interfaces */
interface EntrollmentStatusCount {
  [key: string]: number;
}

interface IProps {
  course: CourseListWithFilter_Course;
  handleDelete: (id: number) => void;
  refetchCourseList: () => void;
  programs: Programs_Program[];
}
/* #endregion */

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
  programs,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const semesters: SelectOption[] = programs.map((program) => ({
    key: program.id,
    label: program.shortTitle ?? program.title,
  }));

  const [updateCourse] = useAdminMutation<
    UpdateCourseByPk,
    UpdateCourseByPkVariables
  >(UPDATE_COURSE_PROPERTY);

  /* #region callbacks */
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
        changes: {
          visibility: !course.visibility,
        },
      },
    });
    refetchCourseList();
  }, [refetchCourseList, updateCourse, course]);

  const onSemesterChange = useCallback(
    async (id: number) => {
      const response = await updateCourse({
        variables: {
          id: course.id,
          changes: {
            programId: id,
          },
        },
      });

      if (!response.errors) {
        refetchCourseList();
      }
    },
    [refetchCourseList, course.id, updateCourse]
  );

  /* #endregion */

  // EINGELADEN/ BESTÄTIGT/ UNBEWERTET
  // TODO: Which feilds ??
  const makeInvitedConfirmedUnratedField = () => {
    const statusRecordsWithSum: EntrollmentStatusCount = {};
    course.CourseEnrollments.forEach((courseEn) => {
      statusRecordsWithSum[
        courseEn.CourseEnrollmentStatus.value
      ] = statusRecordsWithSum[courseEn.CourseEnrollmentStatus.value]
        ? statusRecordsWithSum[courseEn.CourseEnrollmentStatus.value] + 1
        : 1;
    });
    return `${statusRecordsWithSum[CourseEnrollmentStatus_enum.INVITED] ?? 0}/${
      statusRecordsWithSum[CourseEnrollmentStatus_enum.CONFIRMED] ?? 0
    }/${course.AppliedAndUnratedCount.aggregate?.count}`;
  };

  const makeCompetitionField = () => {
    const statusRecordsWithSum: EntrollmentStatusCount = {};
    course.CourseEnrollments.forEach((courseEn) => {
      statusRecordsWithSum[
        courseEn.CourseEnrollmentStatus.value
      ] = statusRecordsWithSum[courseEn.CourseEnrollmentStatus.value]
        ? statusRecordsWithSum[courseEn.CourseEnrollmentStatus.value] + 1
        : 1;
    });
    return Object.keys(statusRecordsWithSum).reduce(
      (sum, key) => sum + statusRecordsWithSum[key],
      0
    );
  };

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
            <p className="text-gray-700 truncate ...">{course.title}</p>
          </div>
        </td>
        <td className="bg-edu-course-list ml-5">
          <InstructorInARow course={course} refetchData={refetchCourseList} />
        </td>
        <td className="bg-edu-course-list">
          {/* KURSLEITUNG */}
          <div>
            <p className="text-sm leading-none text-gray-600 ml-5">
              {makeCompetitionField()}
            </p>
          </div>
        </td>
        <td className="bg-edu-course-list">
          {/* EINGELADEN/ BESTÄTIGT/ UNBEWERTET */}
          <div>
            <p className="text-sm leading-none text-gray-600 ml-5">
              {makeInvitedConfirmedUnratedField()}
            </p>
          </div>
        </td>
        <td className="bg-edu-course-list">
          {/* Program */}
          <div className="flex items-center space-x-2">
            <EhSelect
              value={course.Program ? course.Program.id : 0}
              onChangeHandler={onSemesterChange}
              options={semesters}
            />
          </div>
        </td>
        <td className="bg-edu-course-list">
          {/* Status */}
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
          {/* Delete button */}
          <IconButton onClick={onClickDelete}>
            <MdDelete size={24} />
          </IconButton>
        </td>
      </tr>
      <tr className={showDetails ? "h-0" : "h-1"} />
      {showDetails && (
        <CourseDetails course={course} refetchCourseList={refetchCourseList} />
      )}
    </>
  );
};

export default CourseOneRow;
