import { FC, useCallback, useState } from "react";
import { useAdminMutation } from "../../hooks/authedMutation";
import { useAdminQuery } from "../../hooks/authedQuery";
import { COURSE_INSTRUCTOR_LIST } from "../../queries/courseInstructorList";
import { INSERT_A_COURSE } from "../../queries/mutateCourse";
import {
  CourseInstructorList,
  CourseInstructorList_CourseInstructor,
} from "../../queries/__generated__/CourseInstructorList";
import {
  InsertCourse,
  InsertCourseVariables,
} from "../../queries/__generated__/InsertCourse";
import { SelectOption } from "../../types/UIComponents";
import EhButton from "../common/EhButton";
import EhDebounceInput from "../common/EhDebounceInput";
import EhSelect from "../common/EhSelect";

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
  semesters: SelectOption[];
}

const AddCourseForm: FC<IProps> = ({ semesters }) => {
  // State variables
  const [courseTitle, setCourseTitle] = useState("");
  const [instructorID, setInstructorId] = useState("");
  const [programID, setProgramId] = useState("");
  const [insertACourse] = useAdminMutation<InsertCourse, InsertCourseVariables>(
    INSERT_A_COURSE
  );
  // Handler with CallBack
  const handleSaveButtonAction = useCallback(async () => {
    console.log(courseTitle, instructorID, programID);
    if (
      courseTitle.trim().length > 0 &&
      instructorID.trim().length > 0 &&
      programID.trim().length > 0
    ) {
      console.log(courseTitle, instructorID, programID);
      const today = new Date();
      today.setMilliseconds(0);
      today.setSeconds(0);
      today.setMinutes(0);
      today.setHours(0);
      await insertACourse({
        variables: {
          achievementCertificatePossible: true,
          ects: "4.0",
          headingDescriptionField1:
            "The is a course which focused on Algorithm",
          instructorID,
          language: "English",
          program: programID,
          tagline: "Alogorithm, Data science",
          title: courseTitle,
          today,
        },
      });
    }
  }, [insertACourse, courseTitle, instructorID, programID]);

  const onChangeTitle = useCallback(
    (value) => {
      setCourseTitle(value);
    },
    [setCourseTitle]
  );

  const handleInstructorOnchange = useCallback(
    (value: string) => {
      console.log("handleInstructorOnchange change=>", value);
      setInstructorId(value);
    },
    [setInstructorId]
  );

  const handleProgramOnchange = useCallback(
    (value: string) => {
      console.log("program change=>", value);
      setProgramId(value);
    },
    [setProgramId]
  );

  // Effects/ Database Call
  const result = useAdminQuery<CourseInstructorList>(COURSE_INSTRUCTOR_LIST); // Load Instructor list from db
  // const qResult = useAdminQuery<ProgramList>(PROGRAM_LIST); // Load Program list from db
  if (result.loading) {
    return <h2>Loading</h2>;
  }
  if (result.error) {
    return null;
  }

  // Prepare Instructor data for the UI
  const courseInstructors = [...(result.data?.CourseInstructor || [])];
  const instructorsSortedByFirstName = courseInstructors.sort(ShortByFirstName);
  const instructorList: SelectOption[] = instructorsSortedByFirstName.map(
    (instructor) => ({
      value: instructor.Expert.User.id,
      label: makeFullName(instructor),
    })
  );

  return (
    <div className="p-20 flex flex-col space-y-10">
      <div>
        <div className="">
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
              value={programID}
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
