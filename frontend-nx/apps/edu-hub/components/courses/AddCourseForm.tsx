import { CircularProgress } from '@material-ui/core';
import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, useState } from 'react';
import { useAdminMutation } from '../../hooks/authedMutation';
import { useAdminQuery } from '../../hooks/authedQuery';
import { COURSE_INSTRUCTOR_LIST } from '../../queries/courseInstructorList';
import { INSERT_A_COURSE } from '../../queries/mutateCourse';
import {
  CourseInstructorList,
  CourseInstructorList_CourseInstructor,
} from '../../queries/__generated__/CourseInstructorList';
import {
  InsertSingleCourse,
  InsertSingleCourseVariables,
} from '../../queries/__generated__/InsertSingleCourse';
import { Programs_Program } from '../../queries/__generated__/Programs';
import { SelectOption } from '../../types/UIComponents';
import EhButton from '../common/EhButton';
import EhDebounceInput from '../common/EhDebounceInput';
import EhSelect from '../common/EhSelect';

const makeFullName = (instructor: CourseInstructorList_CourseInstructor) => {
  return (
    instructor.Expert.User.firstName + ' ' + instructor.Expert.User.lastName
  );
};

interface IProps {
  programs: Programs_Program[];
  defaultProgramId: number;
  closeModalHandler: (refetch: boolean) => void;
}
const AddCourseForm: FC<IProps> = ({
  programs,
  defaultProgramId,
  closeModalHandler,
}) => {
  const { t } = useTranslation('course-page');
  // DB request
  const instructorListRequest = useAdminQuery<CourseInstructorList>(
    COURSE_INSTRUCTOR_LIST
  ); // Load Instructor list from db
  const courseInstructors = [
    ...(instructorListRequest.data?.CourseInstructor || []),
  ].sort((a, b) =>
    a.Expert.User.lastName.localeCompare(b.Expert.User.lastName)
  );

  if (instructorListRequest.error) {
    console.log(instructorListRequest.error);
  }

  const instructorList: SelectOption[] = courseInstructors.map(
    (instructor) => ({
      key: instructor.Expert.id,
      label: makeFullName(instructor),
    })
  );
  if (instructorListRequest.loading) {
    return <CircularProgress />;
  }
  return (
    <>
      {instructorList.length > 0 ? (
        <Form
          defaultProgramId={defaultProgramId}
          instructorList={instructorList}
          programs={programs}
          closeModalHandler={closeModalHandler}
        />
      ) : (
        <p>{t('no-instructor')}</p>
      )}
    </>
  );
};
export default AddCourseForm;

interface IAddCourseProps extends IProps {
  instructorList: SelectOption[];
}
const Form: FC<IAddCourseProps> = ({
  programs,
  instructorList,
  defaultProgramId,
  closeModalHandler,
}) => {
  const { t } = useTranslation('course-page');
  const semesters: SelectOption[] = programs.map((p) => {
    return {
      key: p.id,
      label: p.shortTitle ?? p.title,
    };
  });
  /* #region Mutation endpoints */
  const [insertACourse, { error: insertError }] = useAdminMutation<
    InsertSingleCourse,
    InsertSingleCourseVariables
  >(INSERT_A_COURSE);
  /* #endregion */

  /* #region state variables */
  const [courseTitle, setCourseTitle] = useState('');
  const [programId, setProgramId] = useState(defaultProgramId);
  const [instructorID, setInstructorId] = useState(instructorList[0].key);
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
          course: {
            achievementCertificatePossible: false,
            attendanceCertificatePossible: false,
            applicationEnd: today,
            ects: '5.0',
            headingDescriptionField1: '',
            language: 'DE',
            maxMissedSessions: 3,
            programId,
            tagline: '',
            title: courseTitle,
            CourseInstructors: {
              data: [
                {
                  expertId: instructorID,
                },
              ],
            },
          },
        },
      });
      if (response.errors || !response.data?.insert_Course_one?.id) {
        console.log(response.errors);
        return;
      }
      closeModalHandler(true);
    }
  }, [insertACourse, courseTitle, instructorID, programId, closeModalHandler]);

  const onChangeTitle = useCallback(
    (value: string) => {
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
      setProgramId(value);
    },
    [setProgramId]
  );
  /* #endregion */

  return (
    <div className="p-20 flex flex-col space-y-10">
      {insertError ? (
        <div className="pt-8 text-red-500">
          {insertError.graphQLErrors[0].message}
        </div>
      ) : null}
      <div>
        <div className="flex flex-col">
          <EhDebounceInput
            inputText={courseTitle}
            onChangeHandler={onChangeTitle}
            debounceTime={0}
            placeholder={`${t('course-title')}*`}
          />
        </div>
      </div>
      <div className="flex">
        <div className="w-2/6">
          <label className="mr-4" htmlFor="select-instructor">
            {t('course-instructor')}
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
        <div className="flex">
          <label className="w-2/6" htmlFor="select-semester">
            {t('semester')}
          </label>
          <div className="w-5/6">
            <EhSelect
              value={programId}
              onChangeHandler={handleProgramOnchange}
              options={semesters}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <div className="pt-10 mt-10">
          <EhButton
            buttonText={t('create')}
            onClickCallback={handleSaveButtonAction}
          />
        </div>
      </div>
    </div>
  );
};
