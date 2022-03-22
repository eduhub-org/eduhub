import { FC, useCallback, useState } from "react";
import { useAdminMutation } from "../../hooks/authedMutation";
import { useAdminQuery } from "../../hooks/authedQuery";
import { COURSE_INSTRUCTOR_LIST } from "../../queries/courseInstructorList";
import { INSERT_A_COURSE } from "../../queries/mutateCourse";
import { INSERT_A_COURSEINSTRUCTOR } from "../../queries/mutateCourseInstructor";
import {
  CourseInstructorList,
  CourseInstructorList_CourseInstructor,
} from "../../queries/__generated__/CourseInstructorList";
import {
  InsertCourse,
  InsertCourseVariables,
} from "../../queries/__generated__/InsertCourse";
import {
  InsertCourseInstructor,
  InsertCourseInstructorVariables,
} from "../../queries/__generated__/InsertCourseInstructor";
import { ProgramListNoCourse_Program } from "../../queries/__generated__/ProgramListNoCourse";
import { SelectOption } from "../../types/UIComponents";
import EhButton from "../common/EhButton";
import EhDebounceInput from "../common/EhDebounceInput";
import EhSelect from "../common/EhSelect";

/* #region Helper Functions */
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
/* #endregion */

/* #region local interfaces */
interface IProps {
  programs: ProgramListNoCourse_Program[];
  onSavedCourse: (success: boolean) => void;
}
/* #endregion */

const AddCourseForm: FC<IProps> = ({ programs, onSavedCourse }) => {
  /* #region Mutation endpoints */
  const [insertACourse] = useAdminMutation<InsertCourse, InsertCourseVariables>(
    INSERT_A_COURSE
  );
  const [insertCourseInstructor] = useAdminMutation<
    InsertCourseInstructor,
    InsertCourseInstructorVariables
  >(INSERT_A_COURSEINSTRUCTOR);
  const result = useAdminQuery<CourseInstructorList>(COURSE_INSTRUCTOR_LIST); // Load Instructor list from db

  /* #endregion */

  /* #region Process data for UI */
  const courseInstructors = [...(result.data?.CourseInstructor || [])];
  // courseInstructors.sort((a,b)=> (a.id - b.id))
  const instructorsSortedByFirstName = courseInstructors.sort(ShortByFirstName);
  const instructorList: SelectOption[] = instructorsSortedByFirstName.map(
    (instructor) => ({
      value: instructor.Expert.id.toString(),
      label: makeFullName(instructor),
    })
  );
  /* #endregion */

  /* #region state variables */
  const [courseTitle, setCourseTitle] = useState("");
  const [programId, setprogramId] = useState(
    programs.length > 0 ? programs[0].id : 0
  );
  const [instructorID, setInstructorId] = useState(
    instructorList.length > 0 ? parseInt(instructorList[0].value, 10) : 0
  );
  /* #endregion */

  /* #region  Handler with CallBack */
  const handleSaveButtonAction = useCallback(async () => {
    if (courseTitle.trim().length > 0 && instructorID > 0 && programId > 0) {
      const today = new Date();
      today.setMilliseconds(0);
      today.setSeconds(0);
      today.setMinutes(0);
      today.setHours(0);
      const response = await insertACourse({
        variables: {
          achievementCertificatePossible: false,
          attendanceCertificatePossible: false,
          applicationEnd: today,
          ects: "5.0",
          headingDescriptionField1: "",
          language: "English",
          maxMissedSessions: 3,
          programId,
          tagline: "",
          title: courseTitle,
        },
      });
      if (!response.errors && response.data && response.data.insert_Course) {
        const res = await insertCourseInstructor({
          variables: {
            courseId: response.data.insert_Course.returning[0].id,
            expertId: instructorID,
          },
        });
      }
      onSavedCourse(true);
    }
  }, [
    insertACourse,
    courseTitle,
    instructorID,
    programId,
    insertCourseInstructor,
    onSavedCourse,
  ]);

  const onChangeTitle = useCallback(
    (value) => {
      setCourseTitle(value);
    },
    [setCourseTitle]
  );

  const handleInstructorOnchange = useCallback(
    (value: string) => {
      setInstructorId(parseInt(value, 10));
    },
    [setInstructorId]
  );

  const handleProgramOnchange = useCallback(
    (value: string) => {
      setprogramId(parseInt(value, 10));
    },
    [setprogramId]
  );
  /* #endregion */

  if (result.loading) {
    return <h2>Loading</h2>;
  }
  if (result.error) {
    return null;
  }

  const semesters: SelectOption[] = programs.map((program) => ({
    value: program.id.toString(),
    label: program.shortTitle ?? program.title,
  }));

  return (
    <div className="p-20 flex flex-col space-y-10">
      <div>
        <div className="flex flex-col">
          <EhDebounceInput
            inputText={courseTitle}
            onChangeHandler={onChangeTitle}
            placeholder="Titel des Kurses eingeben*"
          />
        </div>
      </div>
      <div className="flex">
        <div className="w-2/6">
          <label className="mr-4" htmlFor="select-instructor">
            Kursleitung
          </label>
        </div>
        <div className="w-5/6">
          <EhSelect
            value={instructorID.toString()}
            onChangeHandler={handleInstructorOnchange}
            options={instructorList}
          />
        </div>
      </div>
      <div className="flex flex-col space-y-2">
        <div>
          <label htmlFor="select-semester" className="text-gray-600">
            Vorname Nachname (emailadresse@gmx.de)
          </label>
        </div>
        <div className="flex">
          <label className="w-2/6" htmlFor="select-semester">
            Semester
          </label>
          <div className="w-5/6">
            <EhSelect
              value={programId.toString()}
              onChangeHandler={handleProgramOnchange}
              options={semesters}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <div className="pt-10 mt-10">
          <EhButton
            buttonText="Anlegen"
            onClickCallback={handleSaveButtonAction}
          />
        </div>
      </div>
    </div>
  );
};

export default AddCourseForm;
