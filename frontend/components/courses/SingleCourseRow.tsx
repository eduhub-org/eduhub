import { Button, IconButton } from "@material-ui/core";
import { TFunction } from "next-i18next";
import { FC, useCallback, useState } from "react";
import {
  MdAddCircle,
  MdDelete,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdUploadFile,
} from "react-icons/md";
import { useAdminMutation } from "../../hooks/authedMutation";
import {
  DELETE_A_COURSE,
  UPDATE_COURSE_PROPERTY,
} from "../../queries/mutateCourse";
import {
  DELETE_COURSE_INSRTRUCTOR,
  INSERT_A_COURSEINSTRUCTOR,
} from "../../queries/mutateCourseInstructor";
import { INSERT_EXPERT } from "../../queries/user";
import { AdminCourseList_Course } from "../../queries/__generated__/AdminCourseList";
import {
  DeleteCourseByPk,
  DeleteCourseByPkVariables,
} from "../../queries/__generated__/DeleteCourseByPk";
import {
  DeleteCourseInstructor,
  DeleteCourseInstructorVariables,
} from "../../queries/__generated__/DeleteCourseInstructor";
import {
  InsertCourseInstructor,
  InsertCourseInstructorVariables,
} from "../../queries/__generated__/InsertCourseInstructor";
import {
  InsertExpert,
  InsertExpertVariables,
} from "../../queries/__generated__/InsertExpert";
import { Programs_Program } from "../../queries/__generated__/Programs";
import {
  UpdateCourseByPk,
  UpdateCourseByPkVariables,
} from "../../queries/__generated__/UpdateCourseByPk";
import { UserForSelection1_User } from "../../queries/__generated__/UserForSelection1";
import { SelectOption } from "../../types/UIComponents";
import {
  CourseEnrollmentStatus_enum,
  CourseStatus_enum,
  Course_set_input,
} from "../../__generated__/globalTypes";
import { SelectUserDialog } from "../common/dialogs/SelectUserDialog";
import EhCheckBox from "../common/EhCheckbox";
import EhSelect from "../common/EhSelect";
import EhTag from "../common/EhTag";

/* #region Local Interfaces */
interface EntrollmentStatusCount {
  [key: string]: number;
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

interface IPropsCourseOneRow {
  course: AdminCourseList_Course;
  t: TFunction;
  programs: Programs_Program[];
  refetchCourses: () => void;
}
const SingleCourseRow: FC<IPropsCourseOneRow> = ({
  course,
  refetchCourses,
  programs,
  t,
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

  const [deleteACoursByPk] = useAdminMutation<
    DeleteCourseByPk,
    DeleteCourseByPkVariables
  >(DELETE_A_COURSE);

  /* #region callbacks */
  const handleDelete = useCallback(
    async (courseID: number) => {
      const response = await deleteACoursByPk({
        variables: {
          id: courseID,
        },
      });
      if (response.errors) {
        console.log(response.errors);
        return;
      }
      refetchCourses();
    },
    [deleteACoursByPk, refetchCourses]
  );

  const onClickDelete = useCallback(() => {
    handleDelete(course.id);
  }, [handleDelete, course.id]);

  const handleArrowClick = useCallback(() => {
    setShowDetails((previous) => !previous);
  }, [setShowDetails]);

  const onChangeVisivity = useCallback(async () => {
    const response = await updateCourse({
      variables: {
        id: course.id,
        changes: {
          visibility: !course.visibility,
        },
      },
    });
    if (response.errors) {
      console.log(response.errors);
      return;
    }
    refetchCourses();
  }, [refetchCourses, updateCourse, course]);

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
      if (response.errors) {
        console.log(response.errors);
        return;
      }
      refetchCourses();
    },
    [refetchCourses, course.id, updateCourse]
  );

  /* #endregion */

  // EINGELADEN/ BESTÄTIGT/ UNBEWERTET
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
  const pClass = "text-gray-700 truncate font-medium max-w-xs";
  const tdClass = "pl-5";
  return (
    <>
      <tr className="font-medium bg-edu-course-list h-12">
        <td className={tdClass}>
          <div onClick={onChangeVisivity}>
            <EhCheckBox checked={course.visibility ?? false} />
          </div>
        </td>
        <td className={tdClass}>
          <p className={pClass}>{course.title}</p>
        </td>
        <td className={`${tdClass}`}>
          <InstructorColumn
            t={t}
            course={course}
            refetchCourses={refetchCourses}
            programs={programs}
          />
        </td>
        <td className={tdClass}>
          {/* KURSLEITUNG */}
          <p className={pClass}>{makeCompetitionField()}</p>
        </td>
        <td className={tdClass}>
          {/* EINGELADEN/ BESTÄTIGT/ UNBEWERTET */}
          <p className={pClass}>{makeInvitedConfirmedUnratedField()}</p>
        </td>
        <td className={tdClass}>
          {/* Program */}
          <EhSelect
            value={course.Program ? course.Program.id : 0}
            onChangeHandler={onSemesterChange}
            options={semesters}
          />
        </td>
        <td className={tdClass}>
          {/* Status */}
          <div className="flex">
            <p className={pClass}>{courseStatuEnumToNumber(course.status)}</p>
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
        <td className="bg-white">
          {/* Delete button */}
          <IconButton onClick={onClickDelete} size="small">
            <MdDelete />
          </IconButton>
        </td>
      </tr>
      <tr className={showDetails ? "h-0" : "h-1"} />
      {/** Hiden Course Details */}
      {showDetails && (
        <CourseDetails
          course={course}
          refetchCourses={refetchCourses}
          programs={programs}
          t={t}
        />
      )}
    </>
  );
};

export default SingleCourseRow;

const makeFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`;
};

const CourseDetails: FC<IPropsCourseOneRow> = ({ course, refetchCourses }) => {
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

    if (response.errors) {
      console.log(response.errors);
      return;
    }
    refetchCourses();
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
        console.log(response.errors);
        return;
      }
      refetchCourses();
    },
    [deleteInstructorAPI, refetchCourses, course]
  );
  /** #endregion */

  return (
    <>
      <tr className="bg-edu-course-list">
        <td className="" colSpan={1} />
        <td className="px-5 content-start my-8" colSpan={1}>
          <div className="bg-white p-2 mr-5 h-32 justify-end mb-2">
            <Button
              className="absolute b-0 r-0"
              endIcon={<MdUploadFile />}
              variant="outlined"
            >
              {""}
              Upload
            </Button>
          </div>
        </td>
        <td className="px-5 inline-block align-top pb-2" colSpan={1}>
          <div className="flex flex-col space-y-1">
            {
              // Show the all instructors but first one
              course.CourseInstructors.map(
                (courseIn, index) =>
                  index > 0 && (
                    <EhTag
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
        <td className="px-5" colSpan={4}>
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

/* #region Instructor column */
const InstructorColumn: FC<IPropsCourseOneRow> = ({
  course,
  refetchCourses,
}) => {
  const [openInstructorDialog, setOpenInstructorDialog] = useState(false);

  /* # region GraphQLAPIs */
  const [insertCourseInstructor] = useAdminMutation<
    InsertCourseInstructor,
    InsertCourseInstructorVariables
  >(INSERT_A_COURSEINSTRUCTOR);

  const [deleteInstructorAPI] = useAdminMutation<
    DeleteCourseInstructor,
    DeleteCourseInstructorVariables
  >(DELETE_COURSE_INSRTRUCTOR);

  const [insertExpertMutation] = useAdminMutation<
    InsertExpert,
    InsertExpertVariables
  >(INSERT_EXPERT);

  /* # endregion */

  /* #region Callbacks */
  const addInstructorDialogOpener = useCallback(async () => {
    setOpenInstructorDialog(true);
  }, [setOpenInstructorDialog]);

  const deleteInstructorFromACourse = useCallback(
    async (id: number) => {
      const response = await deleteInstructorAPI({
        variables: {
          courseId: course.id,
          expertId: id,
        },
      });

      if (response.errors) {
        console.log(response.errors);
        return;
      }
      refetchCourses();
    },
    [deleteInstructorAPI, refetchCourses, course]
  );

  const addInstructorHandler = useCallback(
    async (confirmed: boolean, user: UserForSelection1_User | null) => {
      if (!confirmed || user == null) {
        setOpenInstructorDialog(false);
        return;
      }

      let expertId = -1;
      if (user.Experts.length > 0) {
        expertId = user.Experts[0].id;
      } else {
        const newExpert = await insertExpertMutation({
          variables: {
            userId: user.id,
          },
        });
        if (newExpert.errors) {
          console.log(newExpert.errors);
          setOpenInstructorDialog(false);
          return;
        }
        expertId = newExpert.data?.insert_Expert?.returning[0]?.id || -1;
      }

      if (expertId === -1) {
        setOpenInstructorDialog(false);
        return;
      }
      if (
        course.CourseInstructors.some((expert) => expert.Expert.id === expertId)
      ) {
        setOpenInstructorDialog(false);
        return;
      }
      const response = await insertCourseInstructor({
        variables: {
          courseId: course.id,
          expertId,
        },
      });
      if (response.errors) {
        console.log(response.errors);
        setOpenInstructorDialog(false);
        return;
      }
      refetchCourses();
      setOpenInstructorDialog(false);
    },
    [insertExpertMutation, refetchCourses, course, insertCourseInstructor]
  );
  /* #endregion */

  return (
    <div className="flex flex-row space-x-1 align-middle">
      {
        // we need to show just one instructore in main ui
        course.CourseInstructors.length > 0 && (
          <EhTag
            key={`${course.id}-${course.CourseInstructors[0].Expert.id}`}
            requestDeleteTag={deleteInstructorFromACourse}
            tag={{
              display: makeFullName(
                course.CourseInstructors[0].Expert.User.firstName,
                course.CourseInstructors[0].Expert.User.lastName ?? " "
              ),
              id: course.CourseInstructors[0].Expert.id,
            }}
          />
        )
      }
      <div className="">
        <MdAddCircle
          className="cursor-pointer inline-block align-middle stroke-cyan-500"
          onClick={addInstructorDialogOpener}
        />
      </div>
      {openInstructorDialog && (
        <SelectUserDialog
          onClose={addInstructorHandler}
          open={openInstructorDialog}
          title={"Add Instructor"}
        />
      )}
    </div>
  );
};

/* #endregion */
