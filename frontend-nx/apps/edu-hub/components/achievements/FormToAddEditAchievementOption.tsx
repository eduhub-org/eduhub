import { Checkbox, CircularProgress, FormControlLabel, Link } from '@material-ui/core';
import { Translate } from 'next-translate';
import useTranslation from 'next-translate/useTranslation';
import { FC, ReactNode, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { DebounceInput } from 'react-debounce-input';
import { MdAddCircle, MdUploadFile } from 'react-icons/md';
import {
  AchievementKeys,
  IDataToManipulate,
  IPayload,
  ResponseToARequest,
  TempAchievementOptionCourse,
  TempAchievementOptionMentor,
} from '../../helpers/achievement';
import { downloadCSVFileFromBase64String, makeFullName } from '../../helpers/util';
import { AdminCourseList_Course } from '../../queries/__generated__/AdminCourseList';
import { UserForSelection1_User } from '../../queries/__generated__/UserForSelection1';
import { SelectUserDialog } from '../common/dialogs/SelectUserDialog';
import EhTagStingId from '../common/EhTagStingId';
import TagWithTwoText from '../common/TagWithTwoText';
import CourseListDialog from './CourseListDialog';
import { UploadFile, parseFileUploadEvent } from '../../helpers/filehandling';
//import _ from 'lodash';
import { Button } from '../common/Button';
import { AchievementContext } from './AchievementsHelper';
import { useAdminQuery } from '../../hooks/authedQuery';
import {
  LoadAchievementOptionEvaluationScript,
  LoadAchievementOptionEvaluationScriptVariables,
} from '../../queries/__generated__/LoadAchievementOptionEvaluationScript';
import {
  LOAD_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE,
  LOAD_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT,
} from '../../queries/actions';
// import {
//   LoadAchievementOptionDocumentationTemplate,
//   LoadAchievementOptionDocumentationTemplateVariables,
// } from '../../queries/__generated__/LoadAchievementOptionDocumentationTemplate';
import { ACHIEVEMENT_DOCUMENTATION_TEMPLATES } from '../../queries/achievementDocumentationTemplate';
import { AchievementDocumentationTemplates } from '../../queries/__generated__/AchievementDocumentationTemplates';
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
  const [scriptGoogleUrl, setScriptGoogleUrl] = useState(null as string);
  const [documentTemplateGoogleLink, setDocumentTemplateGoogleLink] = useState(null as string);

  // const loadAchievementOptionDocumentationTemplate = useAdminQuery<
  //   LoadAchievementOptionDocumentationTemplate,
  //   LoadAchievementOptionDocumentationTemplateVariables
  // >(LOAD_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE, {
  //   variables: { path: props.defaultData.documentationTemplateUrl },
  //   skip: props.defaultData.documentationTemplateUrl?.trim().length === 0,
  // });
  const loadAchievementDocumentationTemplates = useAdminQuery<AchievementDocumentationTemplates>(
    ACHIEVEMENT_DOCUMENTATION_TEMPLATES
  );
  const loadAchievementOptionEvaluationScript = useAdminQuery<
    LoadAchievementOptionEvaluationScript,
    LoadAchievementOptionEvaluationScriptVariables
  >(LOAD_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT, {
    variables: { path: props.defaultData.evaluationScriptUrl },
    skip: props.defaultData.evaluationScriptUrl?.trim().length === 0,
  });
  useEffect(() => {
    // if (
    //   loadAchievementOptionDocumentationTemplate &&
    //   loadAchievementOptionDocumentationTemplate.data?.loadAchievementOptionDocumentationTemplate?.link
    // ) {
    //   setDocumentTemplateGoogleLink(
    //     loadAchievementOptionDocumentationTemplate.data.loadAchievementOptionDocumentationTemplate.link
    //   );
    // }

    if (
      loadAchievementOptionEvaluationScript &&
      loadAchievementOptionEvaluationScript.data?.loadAchievementOptionEvaluationScript?.link
    ) {
      setScriptGoogleUrl(loadAchievementOptionEvaluationScript.data.loadAchievementOptionEvaluationScript.link);
    }
  }, [
    // loadAchievementOptionDocumentationTemplate,
    loadAchievementOptionEvaluationScript,
  ]);

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

  /*const handleCheckBox = useCallback((e) => {
    const { name, checked } = e.target;
    dispatch({
      key: name,
      value: checked,
    });
  }, []);*/

  const handleInputFile = useCallback((controlName: string, file: UploadFile) => {
    console.log(controlName);
    dispatch({
      key: controlName,
      value: file,
    });
  }, []);

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
  /* #region Main UI */

  /* const isEqual = () => {
    return _.isEqual(state, props.defaultData);
  };*/

  /**
   * https://www.geeksforgeeks.org/how-to-create-and-download-csv-file-in-javascript/
   * https://stackoverflow.com/questions/73342056/convert-base64-string-to-csv-javascript-giving-blob-error
   */
  const clickCSV = useCallback(() => {
    if (state.csvTemplateUrl) {
      downloadCSVFileFromBase64String(state.csvTemplateUrl);
    }
  }, [state.csvTemplateUrl]);

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
            {state.recordType === 'DOCUMENTATION' ||
              (state.recordType === 'ONLINE_COURSE' && (
                // <CustomFileInput
                //   title={`${t('achievements-page:uploadDocumentationTemplate')} (.doc, .docx, .pdf, .zip, .xls, .csv)*`}
                //   name={AchievementKeys.DOCUMENT_TEMPLATE_FILE}
                //   id={AchievementKeys.DOCUMENT_TEMPLATE_FILE}
                //   accept=".doc, .docx, .zip, .pdf, .xls, .csv"
                //   onChangeHandler={handleInputFile}
                //   customLink={
                //     documentTemplateGoogleLink ? (
                //       <Link href={documentTemplateGoogleLink}>
                //         {t('achievements-page:uploadDocumentationTemplate')}
                //       </Link>
                //     ) : (
                //       ''
                //     )
                //   }
                // />
                <div>
                  {loadAchievementDocumentationTemplates?.data?.AchievementDocumentationTemplate && (
                    <div className="flex flex-col space-y-1">
                      <p>{`${tCommon('achievement-documentation-template')}*`}</p>
                      <EhSelectCustom
                        onChange={handleInputChange}
                        options={loadAchievementDocumentationTemplates.data.AchievementDocumentationTemplate.map(
                          (template) => ({
                            label: template.title,
                            value: template.id,
                          })
                        )}
                        name={'achievementDocumentationTemplateId'}
                        id={'achievementDocumentationTemplateId'}
                        value={state.achievementDocumentationTemplateId ?? ''}
                      />
                    </div>
                  )}
                </div>
              ))}
            {/* {state.recordType === 'DOCUMENTATION_AND_CSV' && (
              //
              <CustomFileInput
                title={`${tCommon('documentation-template-CSV')} (.csv)*`}
                accept=".csv, .CSV"
                onChangeHandler={handleInputFile}
                name={AchievementKeys.CSV_TEMPLATE_FILE}
                id={AchievementKeys.CSV_TEMPLATE_FILE}
                customLink={
                  state.csvTemplateUrl ? (
                    <Link className="cursor-pointer" onClick={clickCSV}>
                      {tCommon('download-csv-template-file')}
                    </Link>
                  ) : (
                    ''
                  )
                }
              />
            )} */}
          </div>
          <div className="flex flex-col w-full justify-end gap-5">
            {/* {state.recordType === 'DOCUMENTATION_AND_CSV' && (
              <div className="flex justify-end">
                <CustomFileInput
                  accept=".py"
                  title={`${tCommon('evaluation-script')} (.py)*`}
                  onChangeHandler={handleInputFile}
                  name={AchievementKeys.EVALUATION_SCRIPT_FILE}
                  id={AchievementKeys.EVALUATION_SCRIPT_FILE}
                  customLink={
                    scriptGoogleUrl ? (
                      <Link href={scriptGoogleUrl}>{tCommon('download-script-file-template')}</Link>
                    ) : (
                      ''
                    )
                  }
                />
              </div>
            )} */}
            {/* <FormControlLabel
              className="justify-end"
              control={
                <Checkbox
                  name={AchievementKeys.SHOW_SCORE_AUTHORS}
                  onChange={handleCheckBox}
                  id={AchievementKeys.SHOW_SCORE_AUTHORS}
                  checked={state.showScoreAuthors}
                />
              }
              label={tCommon('show-authors-column')}
            /> */}
          </div>
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

const CustomFileInput: FC<{
  onChangeHandler: (controlName: string, file: UploadFile) => void;
  name: string;
  accept: string;
  id: string;
  title: string;
  customLink?: ReactNode;
}> = (props) => {
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onClickHandler = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onChange = useCallback(
    async (event) => {
      const file: UploadFile = await parseFileUploadEvent(event);
      setFileName(file.name);
      props.onChangeHandler(props.name, file);
    },
    [props]
  );
  return (
    <>
      <div className="flex flex-row space-x-1">
        <div className="flex flex-col space-y-1 items-center ">
          <p className="w-full">{props.title}</p>
          <div className="h-12 text-center pt-3  px-2  bg-white  w-full">
            {fileName.trim().length > 0 ? <p>{fileName}</p> : props.customLink ? <>{props.customLink}</> : <></>}
          </div>
        </div>
        <div className="pt-6 pl-1">
          <div className="h-10 w-10  rounded-full border-2 border-gray-400 flex justify-center items-center">
            <MdUploadFile size="1.5em" className="cursor-pointer" onClick={onClickHandler} />
          </div>
          <input
            accept={props.accept}
            onChange={onChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
            type="file"
            name={props.name}
            id={props.id}
          />
        </div>
      </div>
    </>
  );
};

/* #endregion */
