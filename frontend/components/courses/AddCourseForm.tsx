import { FC, useCallback, useState } from "react";
import { useAdminMutation } from "../../hooks/authedMutation";
import { INSERT_A_COURSE } from "../../queries/mutateCourse";
import { INSERT_A_COURSEINSTRUCTOR } from "../../queries/mutateCourseInstructor";
import {
  InsertCourse,
  InsertCourseVariables,
} from "../../queries/__generated__/InsertCourse";
import {
  InsertCourseInstructor,
  InsertCourseInstructorVariables,
} from "../../queries/__generated__/InsertCourseInstructor";
import { SelectOption } from "../../types/UIComponents";
import EhButton from "../common/EhButton";
import EhDebounceInput from "../common/EhDebounceInput";
import EhSelect from "../common/EhSelect";

interface IProps {
  programs: SelectOption[];
  instructors: SelectOption[];
  refetchContactList: () => void;
}
const AddCourseForm: FC<IProps> = ({
  programs,
  instructors,
  refetchContactList,
}) => {
  /* #region Mutation endpoints */
  const [insertACourse] = useAdminMutation<InsertCourse, InsertCourseVariables>(
    INSERT_A_COURSE
  );
  const [insertCourseInstructor] = useAdminMutation<
    InsertCourseInstructor,
    InsertCourseInstructorVariables
  >(INSERT_A_COURSEINSTRUCTOR);

  /* #endregion */

  /* #region state variables */
  const [courseTitle, setCourseTitle] = useState("");
  const [programId, setprogramId] = useState(programs[0].key);
  const [instructorID, setInstructorId] = useState(instructors[0].key);
  /* #endregion */

  /* #region  Handler with CallBack */
  const handleSaveButtonAction = useCallback(async () => {
    if (courseTitle.trim().length > 0) {
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

      if (response.errors || !response.data?.insert_Course) {
        console.log(response.errors);
        return;
      }
      const res = await insertCourseInstructor({
        variables: {
          courseId: response.data.insert_Course.returning[0].id,
          expertId: instructorID,
        },
      });
      if (res.errors) return;

      refetchContactList();
    }
  }, [
    insertACourse,
    courseTitle,
    instructorID,
    programId,
    insertCourseInstructor,
    refetchContactList,
  ]);

  const onChangeTitle = useCallback(
    (value) => {
      setCourseTitle(value);
    },
    [setCourseTitle]
  );

  const handleInstructorOnchange = useCallback(
    (value: number) => {
      setInstructorId(value);
    },
    [setInstructorId]
  );

  const handleProgramOnchange = useCallback(
    (value: number) => {
      setprogramId(value);
    },
    [setprogramId]
  );
  /* #endregion */

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
            value={instructorID}
            onChangeHandler={handleInstructorOnchange}
            options={instructors}
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
              value={programId}
              onChangeHandler={handleProgramOnchange}
              options={programs}
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
