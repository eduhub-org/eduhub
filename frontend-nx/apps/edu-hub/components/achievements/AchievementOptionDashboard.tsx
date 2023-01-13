import { IconButton } from '@material-ui/core';
import { Translate } from 'next-translate';
import useTranslation from 'next-translate/useTranslation';
import { createContext, FC, useCallback, useContext, useState } from 'react';
import {
  MdDelete,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from 'react-icons/md';
import { IPayload, UploadFileTypes } from '../../helpers/achievement';
import { UploadFile } from '../../helpers/filehandling';
import { makeFullName } from '../../helpers/util';
import { useAdminMutation } from '../../hooks/authedMutation';
import { useAdminQuery } from '../../hooks/authedQuery';
import { IUserProfile } from '../../hooks/user';
import { ACHIEVEMENT_OPTIONS } from '../../queries/achievement';
import {
  SAVE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE,
  SAVE_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT,
} from '../../queries/actions';
import {
  DELETE_AN_ACHIEVEMENT_OPTION,
  UPDATE_AN_ACHIEVEMENT_OPTION,
} from '../../queries/mutateAchievement';
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../queries/programList';
import {
  AchievementOptionList,
  AchievementOptionListVariables,
  AchievementOptionList_AchievementOption,
} from '../../queries/__generated__/AchievementOptionList';
import { AdminCourseList_Course } from '../../queries/__generated__/AdminCourseList';
import {
  DeleteAnAchievementOption,
  DeleteAnAchievementOptionVariables,
} from '../../queries/__generated__/DeleteAnAchievementOption';
import { Programs } from '../../queries/__generated__/Programs';
import {
  SaveAchievementOptionDocumentationTemplate,
  SaveAchievementOptionDocumentationTemplateVariables,
} from '../../queries/__generated__/SaveAchievementOptionDocumentationTemplate';
import {
  SaveAchievementOptionEvaluationScript,
  SaveAchievementOptionEvaluationScriptVariables,
} from '../../queries/__generated__/SaveAchievementOptionEvaluationScript';
import {
  UpdateAnAchievementOption,
  UpdateAnAchievementOptionVariables,
} from '../../queries/__generated__/UpdateAnAchievementOption';
import { StaticComponentProperty } from '../../types/UIComponents';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import EhAddButton from '../common/EhAddButton';
import EhTag from '../common/EhTag';
import TagWithTwoText from '../common/TagWithTwoText';
import Loading from '../courses/Loading';
import { ProgramsMenubar } from '../program/ProgramsMenubar';
import AddAchievementOption from './AddAchievementOption';
import EditAchievementOption from './EditAchievementOption';

interface IContext {
  achievementRTypes: string[];
  refetchAchievementOptions?: () => void;
  course?: AdminCourseList_Course;
  programID: number;
  setProgramID: (id: number) => void;
  userId: string | undefined;
  userProfile: IUserProfile | undefined;
  queryUpdateAchievementOptions: (
    id: number,
    payLoad: IPayload,
    onSuccess?: (success: boolean) => void
  ) => Promise<boolean>;
  uploadFile: (
    file: UploadFile,
    achievementOptionId: number,
    type: string
  ) => Promise<string | undefined>;
  t: Translate;
  setAlertMessage: (message: string) => void;
}

export const AchievementContext = createContext({} as IContext);

interface IPropsDashBoard {
  course?: AdminCourseList_Course;
  userId: string | undefined;
  userProfile: IUserProfile | undefined;
  achievementRecordTypes: string[];
}
const AchievementOptionDashboard: FC<IPropsDashBoard> = (props) => {
  const defaultProgram = -1; // All tab
  const [currentProgramId, setCurrentProgramId] = useState(defaultProgram);
  const [alertMessage, setAlertMessage] = useState('');

  const { t } = useTranslation();
  const achievementsRequest = useAdminQuery<
    AchievementOptionList,
    AchievementOptionListVariables
  >(ACHIEVEMENT_OPTIONS, {
    variables: {
      where:
        currentProgramId > -1
          ? {
              AchievementOptionCourses: {
                Course: {
                  Program: {
                    id: { _eq: currentProgramId },
                  },
                },
              },
            }
          : {},
    },
  });

  const refetch = useCallback(() => {
    achievementsRequest.refetch();
  }, [achievementsRequest]);

  const aOptions = [...(achievementsRequest.data?.AchievementOption || [])];

  const [updateAchievement] = useAdminMutation<
    UpdateAnAchievementOption,
    UpdateAnAchievementOptionVariables
  >(UPDATE_AN_ACHIEVEMENT_OPTION);

  const queryUpdateAchievementOptions = useCallback(
    async (
      id: number,
      payLoad: IPayload,
      onSuccess?: (success: boolean) => void
    ): Promise<boolean> => {
      try {
        const response = await updateAchievement({
          variables: {
            id,
            changes: {
              [payLoad.key]: payLoad.value,
            },
          },
        });
        if (onSuccess) {
          if (response.errors) {
            onSuccess(false);
          } else {
            onSuccess(true);
            return true;
          }
        }
      } catch (error) {
        console.log(error);
      }
      return false;
    },
    [updateAchievement]
  );

  /* #region Database and ServerLess Functions Declarations */
  const [saveAchievementOptionDocumentationTemplate] = useAdminMutation<
    SaveAchievementOptionDocumentationTemplate,
    SaveAchievementOptionDocumentationTemplateVariables
  >(SAVE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE);

  const [saveAchievementOptionEvaluationScript] = useAdminMutation<
    SaveAchievementOptionEvaluationScript,
    SaveAchievementOptionEvaluationScriptVariables
  >(SAVE_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT);

  /* #endregion */

  const uploadFile = async (
    file: UploadFile,
    achievementOptionId: number,
    type: string
  ): Promise<string | undefined> => {
    let link: string | undefined;
    try {
      switch (type) {
        case UploadFileTypes.SAVE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE: {
          const response = await saveAchievementOptionDocumentationTemplate({
            variables: {
              base64File: file.data,
              courseId: 236,
            },
          });

          if (
            response.data &&
            response.data.saveAchievementOptionDocumentationTemplate
              ?.google_link
          ) {
            const url =
              response.data.saveAchievementOptionDocumentationTemplate
                .google_link;
            const dbResponse = await queryUpdateAchievementOptions(
              achievementOptionId,
              {
                key: 'documentationTemplateUrl',
                value: url,
              }
            );
            if (dbResponse) return url;
          }
          break;
        }

        case UploadFileTypes.SAVE_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT: {
          const res2 = await saveAchievementOptionEvaluationScript({
            variables: {
              base64File: file.data,
              courseId: achievementOptionId,
            },
          });
          if (
            res2.data &&
            res2.data.saveAchievementOptionEvaluationScript?.google_link
          ) {
            const url =
              res2.data &&
              res2.data.saveAchievementOptionEvaluationScript.google_link;
            const dbResponse = await queryUpdateAchievementOptions(
              achievementOptionId,
              {
                key: 'evaluationScriptUrl',
                value: url,
              }
            );
            if (dbResponse) return url;
          }
          break;
        }
      }
    } catch (error) {
      console.log(error);
    }
    return link;
  };

  const provider: IContext = {
    achievementRTypes: props.achievementRecordTypes,
    refetchAchievementOptions: refetch,
    course: props.course,
    programID: defaultProgram,
    setProgramID: setCurrentProgramId,
    userProfile: props.userProfile,
    userId: props.userId,
    queryUpdateAchievementOptions,
    uploadFile,
    t,
    setAlertMessage,
  };

  const closeAlertDialog = useCallback(() => {
    setAlertMessage('');
  }, [setAlertMessage]);
  return (
    <>
      <AchievementContext.Provider value={provider}>
        {alertMessage.trim().length > 0 && (
          <AlertMessageDialog
            alert={alertMessage}
            confirmationText={'OK'}
            onClose={closeAlertDialog}
            open={alertMessage.trim().length > 0}
          />
        )}
        <DashboardContent options={aOptions} />
      </AchievementContext.Provider>
    </>
  );
};

export default AchievementOptionDashboard;

// Start Content

interface IPropsContent {
  options: AchievementOptionList_AchievementOption[];
}
const DashboardContent: FC<IPropsContent> = ({ options }) => {
  const context = useContext(AchievementContext);
  const [showNewAchievementView, setShowNewAchievementView] = useState(false);
  const onProgramFilterChange = useCallback(
    (menu: StaticComponentProperty) => {
      context.setProgramID(menu.key);
    },
    [context]
  );

  const onSuccessAddEdit = useCallback(
    (success: boolean) => {
      if (success && context.refetchAchievementOptions) {
        context.refetchAchievementOptions();
      }
      setShowNewAchievementView(false);
    },
    [context, setShowNewAchievementView]
  );

  const programsRequest = useAdminQuery<Programs>(
    PROGRAMS_WITH_MINIMUM_PROPERTIES
  );

  if (programsRequest.error) {
    console.log(programsRequest.error);
  }
  if (programsRequest.loading) {
    <Loading />;
  }
  const addNewAchievement = useCallback(() => {
    setShowNewAchievementView(!showNewAchievementView);
  }, [setShowNewAchievementView, showNewAchievementView]);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-5">
        {!programsRequest.loading && !programsRequest.error && (
          <ProgramsMenubar
            programs={[...(programsRequest?.data?.Program || [])]}
            defaultProgramId={context.programID}
            onTabClicked={onProgramFilterChange}
          />
        )}
      </div>
      <div className="flex flex-col space-y-1">
        <div className="flex justify-end ">
          <EhAddButton
            buttonClickCallBack={addNewAchievement}
            text={context.t('add-new')}
          />
        </div>
        <AchievementList options={options} />
        {showNewAchievementView && (
          <div className="flex bg-edu-light-gray">
            {<AddAchievementOption onSuccess={onSuccessAddEdit} />}
          </div>
        )}
        {context.achievementRTypes.length > 0 && (
          <div className="flex justify-end">
            <EhAddButton
              buttonClickCallBack={addNewAchievement}
              text={context.t('add-new')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Start AchievementList
const AchievementList: FC<IPropsContent> = ({ options }) => {
  const { t } = useTranslation('course-page');
  return (
    <>
      <div className="grid grid-cols-3 gap-5 pl-5">
        <p>{t('tableHeaderTitle')}</p>
        <p>{t('tableHeaderInstructor')}</p>
        <p>{t('coursesHeadline') + ' & ' + t('tableHeaderProgram')}</p>
      </div>
      {options.map((ac: AchievementOptionList_AchievementOption, index) => (
        <AchievementRow key={`list-data-${index}`} item={ac} />
      ))}
    </>
  );
};

// Start AchievementRow
interface IPropsForARow {
  item: AchievementOptionList_AchievementOption;
}
const AchievementRow: FC<IPropsForARow> = (props) => {
  const [showDetails, setShowDetails] = useState(false);
  const context = useContext(AchievementContext);

  const handleArrowClick = useCallback(() => {
    setShowDetails((previous) => !previous);
  }, [setShowDetails]);

  const onSuccessAddEdit = useCallback(
    (success: boolean) => {
      if (success && context.refetchAchievementOptions) {
        context.refetchAchievementOptions();
      }
    },
    [context]
  );

  const [queryDeleteAnAchievement] = useAdminMutation<
    DeleteAnAchievementOption,
    DeleteAnAchievementOptionVariables
  >(DELETE_AN_ACHIEVEMENT_OPTION);

  const onClickDeleteAnAchievement = useCallback(async () => {
    try {
      const response = await queryDeleteAnAchievement({
        variables: { id: props.item.id },
      });
      if (response.errors) {
        console.log(response.errors);
        onSuccessAddEdit(false);
      } else {
        onSuccessAddEdit(true);
      }
    } catch (error) {
      console.log(error);
      context.setAlertMessage(error.message);
    }
  }, [queryDeleteAnAchievement, props.item.id, onSuccessAddEdit, context]);
  return (
    <>
      <div className="grid grid-cols-3 gap-5 pl-5 bg-edu-row-color py-2 items-center">
        <p className="text-ellipsis text-gray-700 font-medium grid grid-cols-1">
          {props.item.title}
        </p>
        {/* Authors */}
        <div className="flex items-center flex-wrap gap-2">
          {props.item.AchievementOptionMentors.map((men, index) => (
            <div key={`mentor-${index}`} className="grid grid-cols-1">
              <EhTag
                tag={{
                  display: makeFullName(men.User.firstName, men.User.lastName),
                  id: men.id,
                }}
              />
            </div>
          ))}
        </div>
        {/* Programs and buttons */}
        <div
          id="course-programs-buttons"
          className="flex justify-between gap-5"
        >
          <div
            id="course-programs"
            className="flex flex-wrap items-center gap-2"
          >
            {props.item.AchievementOptionCourses.map((c, index) => (
              <div key={`view-course-${index}`} className="grid grid-cols-1">
                <TagWithTwoText
                  textLeft={c.Course.title}
                  textRight={c.Course.Program?.shortTitle}
                  textClickLink={`/manage/course/${c.courseId}`}
                />
              </div>
            ))}
          </div>
          <div id="buttons" className="flex justify-between">
            <button
              id={`expand-button-${props.item.id}`}
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
            <IconButton
              id={`delete-button-${props.item.id}`}
              onClick={onClickDeleteAnAchievement}
              size="small"
            >
              <MdDelete />
            </IconButton>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="bg-edu-light-gray">
          {
            <EditAchievementOption
              achievementOption={props.item}
              onSuccess={onSuccessAddEdit}
            />
          }
        </div>
      )}
    </>
  );
};
