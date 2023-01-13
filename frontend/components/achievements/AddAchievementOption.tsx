import { FC, useCallback, useContext } from "react";
import { useAdminMutation } from "../../hooks/authedMutation";
import { UploadFileTypes } from "../../helpers/achievement";
import { INSERT_AN_ACHIEVEMENT_OPTION } from "../../queries/mutateAchievement";
import {
  InsertAnAchievementOption,
  InsertAnAchievementOptionVariables,
} from "../../queries/__generated__/InsertAnAchievementOption";
import { AchievementRecordType_enum } from "../../__generated__/globalTypes";
import { AchievementContext } from "./AchievementOptionDashboard";
import {
  IDataToManipulate,
  TempAchievementOptionCourse,
  TempAchievementOptionMentor,
} from "../../helpers/achievement";
import AddEditAchievementOptionComponent from "./AddEditAchievementOptionComponent";
interface IProps {
  onSuccess: (success: boolean) => void;
}

const AddAchievemenOption: FC<IProps> = ({ onSuccess }) => {
  const context = useContext(AchievementContext);
  const profile = context.userProfile;
  /* #region Database and ServerLess Fuctions Declarations */
  const [insertAnAchievement] = useAdminMutation<
    InsertAnAchievementOption,
    InsertAnAchievementOptionVariables
  >(INSERT_AN_ACHIEVEMENT_OPTION);
  /* #endregion */

  const onSave = useCallback(
    async (data: IDataToManipulate) => {
      try {
        const response = await insertAnAchievement({
          variables: {
            data: {
              title: data.title,
              description: data.description,
              evaluationScriptUrl: "", // This field is also mendatory while insert
              documentationTemplateUrl: "", // This field is also mendatory while insert
              recordType: data.recordType as AchievementRecordType_enum,
              AchievementOptionCourses: {
                data: data.courses.map((c) => ({ courseId: c.courseId })),
              },
              AchievementOptionMentors: {
                data: data.mentors.map((e) => ({ userId: e.userId })), // We need to change this field
              },
            },
          },
        });

        if (
          !response.errors &&
          response.data?.insert_AchievementOption_one?.id
        ) {
          const id = response.data.insert_AchievementOption_one.id;
          if (
            data.documentTemplateFile &&
            data.documentTemplateFile.data &&
            data.documentTemplateFile.data.trim().length > 0
          ) {
            await context.uploadFile(
              data.documentTemplateFile,
              id,
              UploadFileTypes.SAVE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE
            );
          }

          if (
            data.evalutionScriptFile &&
            data.evalutionScriptFile.data &&
            data.evalutionScriptFile.data.trim().length > 0
          ) {
            await context.uploadFile(
              data.evalutionScriptFile,
              id,
              UploadFileTypes.SAVE_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT
            );
          }
        }
      } catch (error) {
        console.log(error);
      }

      onSuccess(true);
    },
    [onSuccess, context, insertAnAchievement]
  );

  const data: IDataToManipulate = {
    achievementOptionId: null,
    title: null,
    description: null,
    documentationTemplateUrl: null,
    evaluationScriptUrl: null,
    recordType: context.achievementRTypes[0] as AchievementRecordType_enum,
    mentors: profile
      ? new Array({
          userId: context.userId,
          firstName: profile.firstName,
          lastName: profile.lastName,
        } as TempAchievementOptionMentor)
      : [],
    courses: context.course
      ? new Array({
          courseId: context.course.id,
          id: context.course.id,
          title: context.course.title,
          programShortName: context.course.Program?.shortTitle,
        } as TempAchievementOptionCourse)
      : [],
  };
  return (
    <AddEditAchievementOptionComponent
      defaultData={data}
      onSaveCallBack={onSave}
    />
  );
};

export default AddAchievemenOption;
