import { CircularProgress } from '@mui/material';
import { Translate } from 'next-translate';
import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, useContext, useReducer, useState } from 'react';
import { DebounceInput } from 'react-debounce-input';
import { MdAddCircle } from 'react-icons/md';
import {
  AchievementKeys,
  IDataToManipulate,
  IPayload,
  ResponseToARequest,
  TempAchievementOptionCourse,
  TempAchievementOptionMentor,
} from '../../../helpers/achievement';
import { makeFullName } from '../../../helpers/util';
import { AdminCourseList_Course } from '../../../queries/__generated__/AdminCourseList';
import { UserForSelection1_User } from '../../../queries/__generated__/UserForSelection1';
import { SelectUserDialog } from '../../common/dialogs/SelectUserDialog';
import EhTagStingId from '../../common/EhTagStingId';
import TagWithTwoText from '../../common/TagWithTwoText';
import CourseListDialog from './CourseListDialog';
import { Button } from '../../common/Button';
import { AchievementContext } from './AchievementsHelper';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { ACHIEVEMENT_DOCUMENTATION_TEMPLATES } from '../../../queries/achievementDocumentationTemplate';
import { AchievementDocumentationTemplates } from '../../../queries/__generated__/AchievementDocumentationTemplates';
interface IPropsAddEditAchievementTempData {
  defaultData: IDataToManipulate;
  onSaveCallBack: (data: IDataToManipulate) => Promise<ResponseToARequest>;
}

const FormToAddEditAchievementOption: FC<IPropsAddEditAchievementTempData> = (props) => {
  const context = useContext(AchievementContext);

  const initialState: IDataToManipulate = {
    ...props.defaultData,
  };
  const reducer = (state: IDataToManipulate = initialState, payload: IPayload) => {
    return { ...state, [payload.key]: payload.value };
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  const [showMentorDialog, setShowMentorDialog] = useState(false);
  const [showCourseListDialog, setShowCourseListDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadAchievementDocumentationTemplates = useAdminQuery<AchievementDocumentationTemplates>(
    ACHIEVEMENT_DOCUMENTATION_TEMPLATES
  );

  /* #region callbacks */
  const showAddMentorDialog = useCallback(() => {
    setShowMentorDialog(true);
  }, [setShowMentorDialog]);

  const showAddCourseDialog = useCallback(() => {
    setShowCourseListDialog(true);
  }, [setShowCourseListDialog]);

  const addAchievementMentorHandler = useCallback(
    async (confirmed: boolean, user: UserForSelection1_User | null) => {
      if (user && !state.mentors.find((u) => u.userId === user.id)) {
        const newMentor: TempAchievementOptionMentor = {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        };
        dispatch({
          key: 'mentors',
          value: [...state.mentors, newMentor],
        });
      }
      setShowMentorDialog(false);
    },
    [dispatch, state, setShowMentorDialog]
  );

  const onAddCourseHandler = useCallback(
    async (confirm: boolean, course: AdminCourseList_Course | null) => {
      // course.id is courseID, since it is from the table Course
      if (course && !state.courses.find((c) => c.courseId === course.id)) {
        const newCourse: TempAchievementOptionCourse = {
          courseId: course.id,
          programShortName: course.Program?.shortTitle ?? '',
          title: course.title,
        };
        dispatch({
          key: 'courses',
          value: [...state.courses, newCourse],
        });
      }
      setShowCourseListDialog(false);
    },
    [dispatch, state, setShowCourseListDialog]
  );

  const onDeleteAMentor = useCallback(
    async (userIdFromUserTable: string) => {
      if (state.mentors.find((u) => u.userId === userIdFromUserTable)) {
        dispatch({
          key: 'mentors',
          value: [...state.mentors.filter((e) => e.userId !== userIdFromUserTable)],
        });
      }
    },
    [state, dispatch]
  );

  const onDeleteACourse = useCallback(
    async (courseIdFromCourseTable: number) => {
      if (state.courses.find((c) => c.courseId === courseIdFromCourseTable)) {
        dispatch({
          key: 'courses',
          value: [...state.courses.filter((c) => c.courseId !== courseIdFromCourseTable)],
        });
      }
    },
    [state, dispatch]
  );

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      dispatch({
        key: name,
        value,
      });
    },
    [dispatch]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setLoading(true);
      const response = await props.onSaveCallBack(state);
      setLoading(false);
      if (response.message) context.setAlertMessage(response.message);
    },
    [context, props, state]
  );
  /* #endregion */

  const tCommon: Translate = context.t;
  const { t } = useTranslation('course-page');

  return (
    <>
      {showMentorDialog && (
        <SelectUserDialog onClose={addAchievementMentorHandler} open={showMentorDialog} title={tCommon('mentors')} />
      )}
      {showCourseListDialog && (
        <CourseListDialog onClose={onAddCourseHandler} open={showCourseListDialog} title={t('coursesHeadline')} />
      )}
      <form onSubmit={handleSubmit} className="w-full flex flex-col space-y-5 pl-5 py-5">
        <div className="grid grid-cols-3 gap-5">
          {/* Edit title */}
          <EhInputWithTitle2
            label={`${tCommon('project-title')}*`}
            onChangeHandler={handleInputChange}
            name="title"
            id="title"
            value={state.title ?? ''}
            autoFocus={true}
            maxLength={200}
          />

          {/* Edit authors */}
          <div className="flex flex-col space-y-1">
            <p>{`${tCommon('project-mentors')}`}</p>
            <div className="flex gap-2 flex-wrap items-center pr-5">
              {state.mentors.map((e, index) => (
                <div key={`mentors-${index}`} className="grid grid-cols-1">
                  <EhTagStingId
                    title={makeFullName(e.firstName, e.lastName)}
                    id={e.userId ?? undefined}
                    requestDeleteTag={onDeleteAMentor}
                  />
                </div>
              ))}
              <div className="cursor-pointer">
                {/* Extra div because class property was not working */}
                <MdAddCircle onClick={showAddMentorDialog} />
              </div>
            </div>
          </div>

          {/* Edit Program and course */}
          <div className="flex flex-col space-y-1">
            <p>{`${tCommon('courses')}`}</p>
            <div className="flex flex-wrap gap-2 items-center pr-5">
              {state.courses.map((course, index) => (
                <div key={`course-${index}`} className="grid grid-cols-1">
                  <TagWithTwoText
                    key={`course-${index}`}
                    textLeft={course.title}
                    textRight={course.programShortName}
                    onRemoveClick={onDeleteACourse}
                    id={course.courseId}
                  />
                </div>
              ))}
              <div className="cursor-pointer">
                {/* Extra div because class property was not working */}
                <MdAddCircle onClick={showAddCourseDialog} />
              </div>
            </div>
          </div>
        </div>

        <div id="edit-description" className="pr-5">
          <EhInputWithTitle2
            label={`${tCommon('project-description')}`}
            onChangeHandler={handleInputChange}
            name="description"
            id="description"
            element={'textarea'}
            maxLength={3000}
            value={state.description ?? ''}
          />
        </div>

        <div id="edit-documentations" className="flex flex-col gap-5 pr-5">
          <div className="h-full flex flex-row justify-between">
            <div className="flex flex-col space-y-1">
              <div className="flex flex-col space-y-1">
                <p>{`${tCommon('achievement-record-type')}*`}</p>
                <EhSelectForEnum2
                  onChange={handleInputChange}
                  options={context.achievementRecordTypes}
                  name={AchievementKeys.RECORD_TYPE}
                  id={AchievementKeys.RECORD_TYPE}
                  value={state.recordType ?? ''}
                />
              </div>
              <p className="text-stela-500">{`* ${tCommon('form-mandatory-field')}`}</p>
            </div>
            {(state.recordType === 'DOCUMENTATION' || state.recordType === 'ONLINE_COURSE') && (
              <div>
                {loadAchievementDocumentationTemplates?.data?.AchievementDocumentationTemplate && (
                  <div className="flex flex-col space-y-1">
                    <p>{`${tCommon('achievement-documentation-template')}*`}</p>
                    <EhSelectCustom
                      onChange={handleInputChange}
                      options={[
                        // Add a default option when state.achievementDocumentationTemplateId is not set
                        !state.achievementDocumentationTemplateId && {
                          label: t('selectTemplateDefaultLabel'),
                          value: '',
                        },
                        ...loadAchievementDocumentationTemplates.data.AchievementDocumentationTemplate.map(
                          (template) => ({
                            label: template.title,
                            value: template.id,
                          })
                        ),
                      ]}
                      name={'achievementDocumentationTemplateId'}
                      id={'achievementDocumentationTemplateId'}
                      value={state.achievementDocumentationTemplateId ?? ''}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col w-full justify-end gap-5"></div>
        </div>
        <div className="flex justify-center">
          <Button type="submit" id="submit-button" filled disabled={state.recordType === 'DOCUMENTATION_AND_CSV'}>
            {loading ? <CircularProgress /> : tCommon('save')}
          </Button>
        </div>
      </form>
    </>
  );
};
export default FormToAddEditAchievementOption;
/* #endregion */

/* #region Custom UI */
type IPropsEhInputWithTitle2 = {
  label: string;
  onChangeHandler: (event: any) => void;
} & { [key: string]: any };

const EhInputWithTitle2: FC<IPropsEhInputWithTitle2> = ({ label, onChangeHandler, ...custom }) => {
  const handOnchange = useCallback(
    (event) => {
      onChangeHandler(event);
    },
    [onChangeHandler]
  );
  return (
    <div className="flex flex-col space-y-1">
      <p>{label}</p>
      <DebounceInput
        className={`h-12
            px-2
            bg-white
            transition
            ease-in-out
            w-full
            border border-solid border-gray-300
            focus:border-none focus:outline-none`}
        onChange={handOnchange}
        debounceTimeout={1000}
        {...custom}
      />
    </div>
  );
};

interface IProsSelect {
  options: string[];
  onChange: (selected: string) => void;
  [key: string]: any;
}

interface IProsSelectCustom {
  options: {
    label: string;
    value: number | string;
  }[];
  onChange: (selected: string) => void;
  [key: string]: any;
}

const EhSelectForEnum2: FC<IProsSelect> = ({ options, onChange, ...custom }) => {
  const onSelectChanged = useCallback(
    (event) => {
      onChange(event);
    },
    [onChange]
  );

  return (
    <select
      className="form-select h-12
      appearance
      block
      w-full
      px-3
      font-normal
      bg-white
      transition
      ease-in-out
      border
      border-solid border-gray-300
      focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
      onChange={onSelectChanged}
      {...custom}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

const EhSelectCustom: FC<IProsSelectCustom> = ({ options, onChange, ...custom }) => {
  const onSelectChanged = useCallback(
    (event) => {
      onChange(event);
    },
    [onChange]
  );

  return (
    <select
      className="form-select h-12
      appearance
      block
      w-full
      px-3
      font-normal
      bg-white
      transition
      ease-in-out
      border
      border-solid border-gray-300
      focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
      onChange={onSelectChanged}
      {...custom}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

// const CustomFileInput: FC<{
//   onChangeHandler: (controlName: string, file: UploadFile) => void;
//   name: string;
//   accept: string;
//   id: string;
//   title: string;
//   customLink?: ReactNode;
// }> = (props) => {
//   const [fileName, setFileName] = useState('');
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const onClickHandler = useCallback(() => {
//     fileInputRef.current?.click();
//   }, []);

//   const onChange = useCallback(
//     async (event) => {
//       const file: UploadFile = await parseFileUploadEvent(event);
//       setFileName(file.name);
//       props.onChangeHandler(props.name, file);
//     },
//     [props]
//   );
//   return (
//     <>
//       <div className="flex flex-row space-x-1">
//         <div className="flex flex-col space-y-1 items-center ">
//           <p className="w-full">{props.title}</p>
//           <div className="h-12 text-center pt-3  px-2  bg-white  w-full">
//             {fileName.trim().length > 0 ? <p>{fileName}</p> : props.customLink ? <>{props.customLink}</> : <></>}
//           </div>
//         </div>
//         <div className="pt-6 pl-1">
//           <div className="h-10 w-10  rounded-full border-2 border-gray-400 flex justify-center items-center">
//             <MdUploadFile size="1.5em" className="cursor-pointer" onClick={onClickHandler} />
//           </div>
//           <input
//             accept={props.accept}
//             onChange={onChange}
//             ref={fileInputRef}
//             style={{ display: 'none' }}
//             type="file"
//             name={props.name}
//             id={props.id}
//           />
//         </div>
//       </div>
//     </>
//   );
// };

/* #endregion */
