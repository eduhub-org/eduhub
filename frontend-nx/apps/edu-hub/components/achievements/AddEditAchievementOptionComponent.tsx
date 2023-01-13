import { Translate } from 'next-translate';
import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, useContext, useReducer, useState } from 'react';
import {
  MdAddCircle,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
} from 'react-icons/md';
import {
  AchievementKeys,
  IDataToManipulate,
  IPayload,
  TempAchievementOptionCourse,
  TempAchievementOptionMentor,
} from '../../helpers/achievement';
import { UploadFile } from '../../helpers/filehandling';
import { makeFullName } from '../../helpers/util';
import { AdminCourseList_Course } from '../../queries/__generated__/AdminCourseList';
import { UserForSelection1_User } from '../../queries/__generated__/UserForSelection1';
import { Button } from '../common/Button';
import { SelectUserDialog } from '../common/dialogs/SelectUserDialog';
import EhInputWithTitle from '../common/EhInputWithTitle';
import EhSelectForEnum from '../common/EhSelectForEnum';
import EhTagStingId from '../common/EhTagStingId';
import TagWithTwoText from '../common/TagWithTwoText';
import { UiFileInputButton } from '../common/UiFileInputButton';
import CourseListDialog from '../courses/CourseListDialog';
import { AchievementContext } from './AchievementOptionDashboard';

interface IState extends IDataToManipulate {
  showMentorDialog: boolean;
  showCourseListDialog: boolean;
  documentationTemplateName: string;
  evaluationScriptName: string;
}
interface IPropsAddEditAchievementTempData {
  defaultData: IDataToManipulate;

  /**
   *  Mandatory if you want to add a new achievement option
   */
  onSaveCallBack?: (data: IDataToManipulate) => void;

  /**
   * Mandatory field if you want to Edit an Achievement option
   */
  onPropertyChanged?: (id: number, property: IPayload) => Promise<boolean>;
}

const AddEditAchievementOptionComponent: FC<
  IPropsAddEditAchievementTempData
> = (props) => {
  const context = useContext(AchievementContext);

  const initialState: IState = {
    ...props.defaultData,
    showMentorDialog: false,
    showCourseListDialog: false,
    documentationTemplateName:
      props.defaultData.documentationTemplateUrl &&
      props.defaultData.documentationTemplateUrl?.trim().length > 0
        ? props.defaultData.documentationTemplateUrl.split('/')[2]
        : '',
    evaluationScriptName:
      props.defaultData.documentationTemplateUrl &&
      props.defaultData.evaluationScriptUrl &&
      props.defaultData.evaluationScriptUrl.trim().length > 0
        ? props.defaultData.evaluationScriptUrl.split('/')[2]
        : '',
  };

  const reducer = (state: IState = initialState, payload: IPayload) => {
    return { ...state, [payload.key]: payload.value };
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  /* #region callbacks */
  const showAddMentorDialog = useCallback(() => {
    dispatch({ key: 'showMentorDialog', value: true });
  }, [dispatch]);

  const showAddCourseDialog = useCallback(() => {
    dispatch({ key: 'showCourseListDialog', value: true });
  }, [dispatch]);

  const onChangeTitle = useCallback(
    async (value: string) => {
      const newPayLoad = { key: 'title', value };
      dispatch(newPayLoad);
      if (props.onPropertyChanged && state.achievementOptionId) {
        await props.onPropertyChanged(state.achievementOptionId, newPayLoad);
      }
    },
    [dispatch, props, state.achievementOptionId]
  );

  const onChangeDescription = useCallback(
    async (value: string) => {
      const newPayLoad = { key: AchievementKeys.DESCRIPTION, value };
      dispatch(newPayLoad);
      if (props.onPropertyChanged && state.achievementOptionId) {
        await props.onPropertyChanged(state.achievementOptionId, newPayLoad);
      }
    },
    [dispatch, props, state.achievementOptionId]
  );

  const checkBoxBottom = useCallback(async (result: ChangeResult) => {
    console.log('Nothing');
  }, []);

  const onRecordTypeChanged = useCallback(
    async (value: string) => {
      const newPayLoad = { key: AchievementKeys.RECORD_TYPE, value };
      dispatch(newPayLoad);
      if (props.onPropertyChanged && state.achievementOptionId) {
        await props.onPropertyChanged(state.achievementOptionId, newPayLoad);
      } // While editing
    },
    [dispatch, props, state.achievementOptionId]
  );

  const onSelectedAchievementOptionDocumentationTemplate = useCallback(
    async (fileUpload: UploadFile | null) => {
      if (fileUpload) {
        dispatch({ key: 'documentationTemplateName', value: fileUpload.name });
        if (props.onPropertyChanged && state.achievementOptionId) {
          // While editing
          await props.onPropertyChanged(state.achievementOptionId, {
            key: AchievementKeys.DOCUMENT_TEMPLATE_FILE,
            value: fileUpload,
          });
        } else {
          dispatch({
            key: AchievementKeys.DOCUMENT_TEMPLATE_FILE,
            value: fileUpload,
          });
        }
      }
    },
    [dispatch, props, state.achievementOptionId]
  );

  const onSelectedAchievementOptionDocumentationTemplateForCSV = useCallback(
    async (fileUpload: UploadFile | null) => {
      if (fileUpload) {
        dispatch({ key: 'documentationTemplateName', value: fileUpload.name });
        if (props.onPropertyChanged && state.achievementOptionId) {
          // While editing
          await props.onPropertyChanged(state.achievementOptionId, {
            key: AchievementKeys.DOCUMENT_TEMPLATE_FILE,
            value: fileUpload,
          });
        } else {
          dispatch({
            key: AchievementKeys.DOCUMENT_TEMPLATE_FILE,
            value: fileUpload,
          });
        }
      }
    },
    [dispatch, props, state.achievementOptionId]
  );

  const onSelectedEvaluationScriptFile = useCallback(
    async (fileUpload: UploadFile | null) => {
      if (fileUpload) {
        dispatch({ key: 'evaluationScriptName', value: fileUpload.name });
        if (props.onPropertyChanged && state.achievementOptionId) {
          await props.onPropertyChanged(state.achievementOptionId, {
            key: AchievementKeys.EVALUATION_SCRIPT_FILE,
            value: fileUpload,
          });
        } else {
          dispatch({
            key: AchievementKeys.EVALUATION_SCRIPT_FILE,
            value: fileUpload,
          });
        }
      }
    },
    [dispatch, props, state.achievementOptionId]
  );

  const addAchievementMentorHandler = useCallback(
    async (confirmed: boolean, user: UserForSelection1_User | null) => {
      if (user && !state.mentors.find((u) => u.userId === user.id)) {
        if (state.achievementOptionId && props.onPropertyChanged) {
          // Update in Database first
          const response = await props.onPropertyChanged(
            state.achievementOptionId,
            {
              key: AchievementKeys.ADD_A_MENTOR,
              value: user.id,
            }
          );
          if (!response) return;
        }
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
      dispatch({ key: 'showMentorDialog', value: false });
    },
    [dispatch, state, props]
  );

  const onAddCourseHandler = useCallback(
    async (confirm: boolean, course: AdminCourseList_Course | null) => {
      // course.id is courseID, since it is from the table Course
      if (course && !state.courses.find((c) => c.courseId === course.id)) {
        if (state.achievementOptionId && props.onPropertyChanged) {
          const response = await props.onPropertyChanged(
            state.achievementOptionId,
            {
              key: AchievementKeys.ADD_A_COURSE,
              value: course.id,
            }
          );
          if (!response) return;
        }
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
      dispatch({ key: 'showCourseListDialog', value: false });
    },
    [dispatch, state, props]
  );

  const onDeleteAMentor = useCallback(
    async (userIdFromUserTable: string) => {
      if (state.mentors.find((u) => u.userId === userIdFromUserTable)) {
        if (state.achievementOptionId && props.onPropertyChanged) {
          const response = await props.onPropertyChanged(
            state.achievementOptionId,
            {
              key: AchievementKeys.DELETE_A_MENTOR,
              value: userIdFromUserTable,
            }
          );
          if (!response) return;
        }
        dispatch({
          key: 'mentors',
          value: [
            ...state.mentors.filter((e) => e.userId !== userIdFromUserTable),
          ],
        });
      }
    },
    [props, state, dispatch]
  );

  const onDeleteACourse = useCallback(
    async (courseIdFromCourseTable: number) => {
      if (state.courses.find((c) => c.courseId === courseIdFromCourseTable)) {
        if (state.achievementOptionId && props.onPropertyChanged) {
          const response = await props.onPropertyChanged(
            state.achievementOptionId,
            {
              key: AchievementKeys.DELETE_A_COURSE,
              value: courseIdFromCourseTable,
            }
          );
          if (!response) return;
        }

        dispatch({
          key: 'courses',
          value: [
            ...state.courses.filter(
              (c) => c.courseId !== courseIdFromCourseTable
            ),
          ],
        });
      }
    },
    [props, state, dispatch]
  );

  const onSaveClick = useCallback(() => {
    if (props.onSaveCallBack) {
      props.onSaveCallBack(state);
    }
  }, [props, state]);

  /* #endregion */

  /* #region UI */
  const tCommon: Translate = context.t;
  const { t } = useTranslation('course-page');
  return (
    <>
      {state.showMentorDialog && (
        <SelectUserDialog
          onClose={addAchievementMentorHandler}
          open={state.showMentorDialog}
          title={tCommon('mentors')}
        />
      )}
      {state.showCourseListDialog && (
        <CourseListDialog
          onClose={onAddCourseHandler}
          open={state.showCourseListDialog}
          title={t('coursesHeadline')}
        />
      )}

      <div className="w-full flex flex-col space-y-5 pl-5 py-5">
        <div className="grid grid-cols-3 gap-5">
          {/* Edit title */}
          <EhInputWithTitle
            label={`${tCommon('title-number-of-characters', {
              numberOfCharacters: 'XXX/200',
            })}*`}
            placeholder=""
            inputText={state.title ?? ''}
            onChangeHandler={onChangeTitle}
            autoFocus={true}
            maxLength={200}
          />

          {/* Edit authors */}
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

          {/* Edit Program and course */}
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

        <div id="edit-description" className="pr-5">
          <EhInputWithTitle
            textArea={true}
            inputText={state.description ?? ''}
            label={`${tCommon('description-number-of-characters', {
              numberOfCharacters: 'XXX/500',
            })}*`}
            placeholder=""
            onChangeHandler={onChangeDescription}
            maxLength={3000}
          />
        </div>

        <div id="edit-documentations" className="grid grid-cols-2 gap-5 pr-5">
          <div className="h-full flex justify-start">
            <div className="flex flex-col space-y-5 justify-between h-full">
              <div className="flex flex-col space-y-1">
                <p>{`${tCommon('achievement-record-type')}*`}</p>
                <EhSelectForEnum
                  selected={state.recordType ?? ''}
                  onChange={onRecordTypeChanged}
                  options={context.achievementRTypes}
                  bg={'white'}
                />
              </div>
              {!state.achievementOptionId &&
                state.title &&
                state.title.trim().length > 0 &&
                state.description &&
                state.description.trim().length > 0 && (
                  <Button onClick={onSaveClick}>Save</Button>
                )}
            </div>
          </div>
          <div className="h-full flex justify-end">
            {state.recordType === 'DOCUMENTATION' && (
              <div className="flex flex-row space-x-1 items-center">
                <EhInputWithTitle
                  label={`${tCommon('documentation-template')} (.doc)*`}
                  placeholder=".doc"
                  disabled={true}
                  inputText={state.documentationTemplateName}
                />
                <div className="pt-6 pl-1">
                  <UiFileInputButton
                    label={`${tCommon('documentation-template')} (.doc)*`}
                    acceptedFileTypes=".doc, .docx"
                    onFileChoosed={
                      onSelectedAchievementOptionDocumentationTemplate
                    }
                  />
                </div>
              </div>
            )}
            {state.recordType === 'DOCUMENTATION_AND_CSV' && (
              <div className="flex flex-col space-y-5">
                <div className="flex flex-row space-x-1 items-center">
                  <EhInputWithTitle
                    label={`${tCommon('documentation-template')} (.doc)*`}
                    placeholder=""
                    disabled={true}
                    inputText={state.documentationTemplateName}
                  />
                  <div className="pt-6 pl-1">
                    <UiFileInputButton
                      label={`${tCommon('documentation-template')} (.doc)`}
                      acceptedFileTypes=".doc, .docx"
                      onFileChoosed={
                        onSelectedAchievementOptionDocumentationTemplateForCSV
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="flex flex-col space-y-2 justify-start">
                    <div className="flex flex-row space-x-1 items-center">
                      <EhInputWithTitle
                        label={`${tCommon('evaluation-script')} (.py)*`}
                        placeholder=""
                        disabled={true}
                        inputText={state.evaluationScriptName}
                      />
                      <div className="pt-6 pl-1">
                        <UiFileInputButton
                          label={`${tCommon('evaluation-script')}`}
                          acceptedFileTypes=".py"
                          onFileChoosed={onSelectedEvaluationScriptFile}
                        />
                      </div>
                    </div>
                    <CustomCheckBox
                      isSelected={true}
                      onChange={checkBoxBottom}
                      text={tCommon('show-authors-column')}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-stela-500">{`* ${tCommon(
          'form-mandatory-field'
        )}`}</p>
      </div>
    </>
  );
  /* #endregion */
};

export default AddEditAchievementOptionComponent;

/* #region Checkbox UI */
interface ChangeResult {
  key?: any;
  checked: boolean;
}
interface CheckboxPros {
  isSelected: boolean;
  key?: any;
  text?: string;
  onChange: (result: ChangeResult) => void;
}
const CustomCheckBox: FC<CheckboxPros> = ({
  isSelected,
  key,
  text,
  onChange,
}) => {
  const [checked, setChecked] = useState(isSelected);

  const changeChecked = useCallback(() => {
    onChange({
      key: key ?? undefined,
      checked: !checked,
    });
    setChecked(!checked);
  }, [setChecked, onChange, checked, key]);
  return (
    <div
      className="flex flex-row space-x-1 cursor-pointer"
      onClick={changeChecked}
    >
      {checked === true ? (
        <MdCheckBox size="1.5em" />
      ) : (
        <MdCheckBoxOutlineBlank size="1.5em" />
      )}
      {text && (
        <label className="inline-block text-gray-800 cursor-pointer">
          {text}
        </label>
      )}
    </div>
  );
};

/* #endregion */
