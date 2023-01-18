import {
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Link,
} from '@material-ui/core';
import { Translate } from 'next-translate';
import useTranslation from 'next-translate/useTranslation';
import {
  FC,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
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
import { makeFullName } from '../../helpers/util';
import { AdminCourseList_Course } from '../../queries/__generated__/AdminCourseList';
import { UserForSelection1_User } from '../../queries/__generated__/UserForSelection1';
import { SelectUserDialog } from '../common/dialogs/SelectUserDialog';
import EhTagStingId from '../common/EhTagStingId';
import TagWithTwoText from '../common/TagWithTwoText';
import CourseListDialog from '../courses/CourseListDialog';
import { UploadFile, parseFileUploadEvent } from '../../helpers/filehandling';
import _ from 'lodash';
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
import {
  LoadAchievementOptionDocumentationTemplate,
  LoadAchievementOptionDocumentationTemplateVariables,
} from '../../queries/__generated__/LoadAchievementOptionDocumentationTemplate';
interface IPropsAddEditAchievementTempData {
  defaultData: IDataToManipulate;
  onSaveCallBack: (data: IDataToManipulate) => Promise<ResponseToARequest>;
}

const FormToAddEditAchievementOption: FC<IPropsAddEditAchievementTempData> = (
  props
) => {
  const context = useContext(AchievementContext);

  const initialState: IDataToManipulate = {
    ...props.defaultData,
  };
  const reducer = (
    state: IDataToManipulate = initialState,
    payload: IPayload
  ) => {
    return { ...state, [payload.key]: payload.value };
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  const [showMentorDialog, setShowMentorDialog] = useState(false);
  const [showCourseListDialog, setShowCourseListDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scriptGoogleUrl, setScriptGoogleUrl] = useState(null as string);
  const [documentTemplateGoogleLink, setDocumentTemplateGoogleLink] = useState(
    null as string
  );

  const loadAchievementOptionDocumentationTemplate = useAdminQuery<
    LoadAchievementOptionDocumentationTemplate,
    LoadAchievementOptionDocumentationTemplateVariables
  >(LOAD_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE, {
    variables: { path: props.defaultData.documentationTemplateUrl },
    skip: props.defaultData.documentationTemplateUrl.trim().length === 0,
  });
  const loadAchievementOptionEvaluationScript = useAdminQuery<
    LoadAchievementOptionEvaluationScript,
    LoadAchievementOptionEvaluationScriptVariables
  >(LOAD_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT, {
    variables: { path: props.defaultData.evaluationScriptUrl },
    skip: props.defaultData.evaluationScriptUrl.trim().length === 0,
  });
  useEffect(() => {
    if (
      loadAchievementOptionDocumentationTemplate &&
      loadAchievementOptionDocumentationTemplate.data
        ?.loadAchievementOptionDocumentationTemplate?.link
    ) {
      setDocumentTemplateGoogleLink(
        loadAchievementOptionDocumentationTemplate.data
          .loadAchievementOptionDocumentationTemplate.link
      );
    }

    if (
      loadAchievementOptionEvaluationScript &&
      loadAchievementOptionEvaluationScript.data
        ?.loadAchievementOptionEvaluationScript?.link
    ) {
      setScriptGoogleUrl(
        loadAchievementOptionEvaluationScript.data
          .loadAchievementOptionEvaluationScript.link
      );
    }
  }, [
    loadAchievementOptionDocumentationTemplate,
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
          value: [
            ...state.mentors.filter((e) => e.userId !== userIdFromUserTable),
          ],
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
          value: [
            ...state.courses.filter(
              (c) => c.courseId !== courseIdFromCourseTable
            ),
          ],
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

  const handleCheckBox = useCallback((e) => {
    const { name, checked } = e.target;
    dispatch({
      key: name,
      value: checked,
    });
  }, []);

  const handleInputFile = useCallback(async (e) => {
    const { name, value } = e.target;
    const file: UploadFile = await parseFileUploadEvent(e);
    dispatch({
      key: name,
      value: file,
    });

    if (name === AchievementKeys.DOCUMENT_TEMPLATE_FILE) {
      dispatch({
        key: 'documentationTemplateUrl',
        value,
      });
      return;
    }
    if (name === AchievementKeys.EVALUATION_SCRIPT_FILE) {
      dispatch({
        key: 'evaluationScriptUrl',
        value,
      });
    }
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
  const isEqual = () => {
    return _.isEqual(state, props.defaultData);
  };

  const tCommon: Translate = context.t;
  const { t } = useTranslation('course-page');

  return (
    <>
      {showMentorDialog && (
        <SelectUserDialog
          onClose={addAchievementMentorHandler}
          open={showMentorDialog}
          title={tCommon('mentors')}
        />
      )}
      {showCourseListDialog && (
        <CourseListDialog
          onClose={onAddCourseHandler}
          open={showCourseListDialog}
          title={t('coursesHeadline')}
        />
      )}
      <form
        onSubmit={handleSubmit}
        className="w-full flex flex-col space-y-5 pl-5 py-5"
      >
        <div className="grid grid-cols-3 gap-5">
          {/* Edit title */}
          <EhInputWithTitle2
            label={`${tCommon('title-number-of-characters', {
              numberOfCharacters: 'XXX/200',
            })}*`}
            onChangeHandler={handleInputChange}
            name="title"
            id="title"
            value={state.title ?? ''}
            autoFocus={true}
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
          <EhInputWithTitle2
            label={`${tCommon('description-number-of-characters', {
              numberOfCharacters: 'XXX/500',
            })}*`}
            onChangeHandler={handleInputChange}
            name="description"
            id="description"
            element={'textarea'}
            maxLength={3000}
            value={state.description ?? ''}
          />
        </div>

        <div id="edit-documentations" className="grid grid-cols-2 gap-5 pr-5">
          <div className="h-full flex justify-start">
            <div className="flex flex-col space-y-5 justify-between h-full">
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
              <p className="text-stela-500">{`* ${tCommon(
                'form-mandatory-field'
              )}`}</p>
            </div>
          </div>
          <div className="h-full flex justify-end">
            {state.recordType === 'DOCUMENTATION' && (
              <div className="flex flex-row space-x-1 items-center">
                <CustomLinkWithTile
                  title={`${tCommon('documentation-template')} (.doc)*`}
                  downloadText={tCommon('download-documentation-template')}
                  googleLink={documentTemplateGoogleLink}
                  path={state.documentationTemplateUrl}
                />

                <div className="pt-6 pl-1">
                  <CustomFileInput
                    name={AchievementKeys.DOCUMENT_TEMPLATE_FILE}
                    id={AchievementKeys.DOCUMENT_TEMPLATE_FILE}
                    accept=".doc, .docx"
                    onChangeHandler={handleInputFile}
                  />
                </div>
              </div>
            )}
            {state.recordType === 'DOCUMENTATION_AND_CSV' && (
              <div className="flex flex-col space-y-5">
                <div className="flex flex-row space-x-1 items-center">
                  <CustomLinkWithTile
                    title={`${tCommon('documentation-template')} (.doc)*`}
                    downloadText={tCommon('download-documentation-template')}
                    googleLink={documentTemplateGoogleLink}
                    path={state.documentationTemplateUrl}
                  />
                  <div className="pt-6 pl-1">
                    <CustomFileInput
                      accept=".doc, .docx"
                      onChangeHandler={handleInputFile}
                      name={AchievementKeys.DOCUMENT_TEMPLATE_FILE}
                      id={AchievementKeys.DOCUMENT_TEMPLATE_FILE}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="flex flex-col space-y-2 justify-start">
                    <div className="flex flex-row space-x-1 items-center">
                      <CustomLinkWithTile
                        title={`${tCommon('evaluation-script')} (.py)*`}
                        downloadText={tCommon('download-script-file-template')}
                        googleLink={scriptGoogleUrl}
                        path={state.evaluationScriptUrl}
                      />
                      <div className="pt-6 pl-1">
                        <CustomFileInput
                          accept=".py"
                          onChangeHandler={handleInputFile}
                          name={AchievementKeys.EVALUATION_SCRIPT_FILE}
                          id={AchievementKeys.EVALUATION_SCRIPT_FILE}
                        />
                      </div>
                    </div>

                    <FormControlLabel
                      control={
                        <Checkbox
                          name={AchievementKeys.SHOW_SCORE_AUTHORS}
                          onChange={handleCheckBox}
                          id={AchievementKeys.SHOW_SCORE_AUTHORS}
                          checked={state.showScoreAuthors}
                        />
                      }
                      label={tCommon('show-authors-column')}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {!isEqual() && (
          <div className="flex justify-center">
            <Button type="submit" id="submit-button" filled>
              {loading ? <CircularProgress /> : tCommon('save')}
            </Button>
          </div>
        )}
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

const EhInputWithTitle2: FC<IPropsEhInputWithTitle2> = ({
  label,
  onChangeHandler,
  ...custom
}) => {
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

const EhSelectForEnum2: FC<IProsSelect> = ({
  options,
  onChange,
  ...custom
}) => {
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

const CustomFileInput: FC<{
  onChangeHandler: (event: any) => void;
  name: string;
  accept: string;
  id: string;
}> = ({ onChangeHandler, name, accept, id }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onClickHandler = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  return (
    <>
      <div className="h-10 w-10  rounded-full border-2 border-gray-400 flex justify-center items-center">
        <MdUploadFile
          size="1.5em"
          className="cursor-pointer"
          onClick={onClickHandler}
        />
      </div>
      <input
        accept={accept}
        onChange={onChangeHandler}
        ref={fileInputRef}
        style={{ display: 'none' }}
        type="file"
        name={name}
        id={id}
      />
    </>
  );
};

const CustomLinkWithTile: FC<{
  title: string;
  googleLink: string;
  path: string;
  downloadText: string;
}> = ({ title, googleLink, path, downloadText }) => {
  const getLastPartOfAnUrl = (location: string) => {
    if (!location || location.trim().length === 0) return '';
    const pathFromDB = (location as string).split('/'); // courseid_8/achievementOptionEvaluationScript/undefined
    if (pathFromDB.length > 1) return pathFromDB.pop();
    return (location as string).split('\\').pop(); // Demo Path of local PC
  };
  const isLinkAndPathSame = googleLink ? googleLink.endsWith(path) : false;
  return (
    <div className="flex flex-col space-y-1 items-center ">
      <p className="w-full">{title}</p>
      <div className="h-12 text-center pt-3  px-2  bg-white  w-full">
        {!path || path.trim().length === 0 ? (
          <></>
        ) : isLinkAndPathSame ? (
          <Link href={googleLink}>{downloadText}</Link>
        ) : (
          <p>{getLastPartOfAnUrl(path)}</p>
        )}
      </div>
    </div>
  );
};

/* #endregion */
