import { IconButton } from "@material-ui/core";
import { useTranslation } from "next-i18next";
import { createContext, FC, useCallback, useContext, useState } from "react";
import {
  MdDelete,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from "react-icons/md";
import { IPayload, UploadFileTypes } from "../../helpers/achievement";
import { UploadFile } from "../../helpers/filehandling";
import { makeFullName } from "../../helpers/util";
import { useAdminMutation } from "../../hooks/authedMutation";
import { useAdminQuery } from "../../hooks/authedQuery";
import { IUserProfile } from "../../hooks/user";
import { ACHIEVEMENT_OPTIONS } from "../../queries/achievement";
import {
  SAVE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE,
  SAVE_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT,
} from "../../queries/actions";
import {
  DELETE_AN_ACHIEVEMENT_OPTION,
  UPDATE_AN_ACHIEVEMENT_OPTION,
} from "../../queries/mutateAchievement";
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from "../../queries/programList";
import {
  AchievementOptionList,
  AchievementOptionListVariables,
  AchievementOptionList_AchievementOption,
} from "../../queries/__generated__/AchievementOptionList";
import { AdminCourseList_Course } from "../../queries/__generated__/AdminCourseList";
import {
  DeleteAnAchievementOption,
  DeleteAnAchievementOptionVariables,
} from "../../queries/__generated__/DeleteAnAchievementOption";
import { Programs } from "../../queries/__generated__/Programs";
import {
  SaveAchievementOptionDocumentationTemplate,
  SaveAchievementOptionDocumentationTemplateVariables,
} from "../../queries/__generated__/SaveAchievementOptionDocumentationTemplate";
import {
  SaveAchievementOptionEvaluationScript,
  SaveAchievementOptionEvaluationScriptVariables,
} from "../../queries/__generated__/SaveAchievementOptionEvaluationScript";
import {
  UpdateAnAchievementOption,
  UpdateAnAchievementOptionVariables,
} from "../../queries/__generated__/UpdateAnAchievementOption";
import { StaticComponentProperty } from "../../types/UIComponents";
import EhAddButton from "../common/EhAddButton";
import EhTag from "../common/EhTag";
import TagWithTwoText from "../common/TagWithTwoText";
import Loading from "../courses/Loading";
import { ProgramsMenubar } from "../program/ProgramsMenubar";
import AddAchievemenOption from "./AddAchievementOption";
import EditAchievementOption from "./EditAchievementOption";

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
    onSuccess?: (sucsse: boolean) => void
  ) => Promise<boolean>;
  uploadFile: (
    file: UploadFile,
    achievementOptionId: number,
    type: string
  ) => Promise<string | undefined>;
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

  const aoptions = [...(achievementsRequest.data?.AchievementOption || [])];

  const [updateAchievement] = useAdminMutation<
    UpdateAnAchievementOption,
    UpdateAnAchievementOptionVariables
  >(UPDATE_AN_ACHIEVEMENT_OPTION);

  const queryUpdateAchievementOptions = useCallback(
    async (
      id: number,
      payLoad: IPayload,
      onSuccess?: (sucsse: boolean) => void
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

  /* #region Database and ServerLess Fuctions Declarations */
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
    console.log(file, type);
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
            response.data.saveAchievementOptionDocumentationTemplate?.google_link
          ) {
            const url =
              response.data.saveAchievementOptionDocumentationTemplate.google_link;
            const dbResponse = await queryUpdateAchievementOptions(
              achievementOptionId,
              {
                key: "documentationTemplateUrl",
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
              res2.data && res2.data.saveAchievementOptionEvaluationScript.google_link;
            const dbResponse = await queryUpdateAchievementOptions(
              achievementOptionId,
              {
                key: "evaluationScriptUrl",
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
  };

  return (
    <>
      <AchievementContext.Provider value={provider}>
        <DashboardContent options={aoptions} />
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
        <div className="flex justify-end">
          <EhAddButton
            buttonClickCallBack={addNewAchievement}
            text="Neuen  hinzufügen"
          />
        </div>
        <AchievementList options={options} />
        {showNewAchievementView && (
          <div className="flex bg-edu-light-gray py-5">
            {<AddAchievemenOption onSuccess={onSuccessAddEdit} />}
          </div>
        )}
        {context.achievementRTypes.length > 0 && (
          <div className="flex justify-end">
            <EhAddButton
              buttonClickCallBack={addNewAchievement}
              text="Neuen  hinzufügen"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Start AchievementList
const ml = "ml-[20px]";
const AchievementList: FC<IPropsContent> = ({ options }) => {
  const context = useContext(AchievementContext);
  const { t } = useTranslation("course-page");
  const thClass = "font-medium text-gray-700 uppercase";
  const pClass = "flex justify-start " + ml;
  return (
    <>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th className={thClass}>
              <p className={pClass}>{t("tableHeaderTitle")}</p>
            </th>
            <th className={thClass}>
              <p className={pClass}>{t("tableHeaderInstructor")}</p>
            </th>
            <th className={thClass}>
              <p className={pClass}>{"Kurse & " + t("tableHeaderProgram")}</p>
            </th>
          </tr>
        </thead>
        <tbody>
          {options.map((ac: AchievementOptionList_AchievementOption, index) => (
            <AchievementRow key={`listData-${index}`} acop={ac} />
          ))}
        </tbody>
      </table>
    </>
  );
};

// Start AchievementRow
interface IPropsForARow {
  acop: AchievementOptionList_AchievementOption;
}
const AchievementRow: FC<IPropsForARow> = (props) => {
  const pClass = "text-gray-700 truncate font-medium ml-[20px]";
  const tdClass = ml;
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
    const response = await queryDeleteAnAchievement({
      variables: { id: props.acop.id },
    });
    if (response.errors) {
      console.log(response.errors);
      onSuccessAddEdit(false);
    } else {
      onSuccessAddEdit(true);
    }
  }, [queryDeleteAnAchievement, onSuccessAddEdit, props]);
  return (
    <>
      <tr className="bg-edu-row-color h-12">
        <td className={tdClass}>
          {/* Title */}
          <p className={`${pClass} max-w-[350px]`}>{props.acop.title}</p>
        </td>
        <td className={tdClass}>
          {/* Mentoren */}
          <div className={`${ml} flex items-center space-x-2`}>
            {props.acop.AchievementOptionMentors.length > 0 &&
              props.acop.AchievementOptionMentors[0].User && (
                <EhTag
                  tag={{
                    display: makeFullName(
                      props.acop.AchievementOptionMentors[0].User.firstName,
                      props.acop.AchievementOptionMentors[0].User.lastName
                    ),
                    id: props.acop.AchievementOptionMentors[0].id,
                  }}
                />
              )}
            {/* <MdAddCircle
                className="cursor-pointer inline-block align-middle stroke-cyan-500"
                onClick={handleArrowClick}
              /> */}
          </div>
        </td>
        <td className={ml}>
          {/* Course */}
          <div className={`flex justify-between ${ml}`}>
            <div className="flex items-center space-x-2">
              {props.acop.AchievementOptionCourses.length > 0 && (
                <TagWithTwoText
                  textLeft={props.acop.AchievementOptionCourses[0].Course.title}
                  textRight={
                    props.acop.AchievementOptionCourses[0].Course.Program
                      ?.shortTitle
                  }
                />
              )}
              {/* <MdAddCircle
                  className="cursor-pointer inline-block align-middle stroke-cyan-500"
                  onClick={handleArrowClick}
                /> */}
            </div>
            <div className="">
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
          </div>
        </td>
        <td className="bg-white">
          {/* Delete button */}
          <IconButton onClick={onClickDeleteAnAchievement} size="small">
            <MdDelete />
          </IconButton>
        </td>
      </tr>

      {showDetails && (
        <tr>
          <td colSpan={3}>
            <div className="flex bg-edu-light-gray pt-5">
              {
                <EditAchievementOption
                  achievementOption={props.acop}
                  onSuccess={onSuccessAddEdit}
                />
              }
            </div>
          </td>
        </tr>
      )}
      <tr className="h-1" />
    </>
  );
};
