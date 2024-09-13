import { FC, useCallback, useContext } from 'react';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { ResponseToARequest, UploadFileTypes } from '../../../helpers/achievement';
import { INSERT_AN_ACHIEVEMENT_OPTION } from '../../../graphql/mutations/mutateAchievement';
import {
  InsertAnAchievementOption,
  InsertAnAchievementOptionVariables,
} from '../../../graphql/__generated__/InsertAnAchievementOption';
import { AchievementRecordType_enum } from '../../../__generated__/globalTypes';
import {
  IDataToManipulate,
  TempAchievementOptionCourse,
  TempAchievementOptionMentor,
} from '../../../helpers/achievement';
import FormToAddEditAchievementOption from './FormToAddEditAchievementOption';
import { AchievementContext } from './AchievementsHelper';
interface IProps {
  onSuccess: (success: boolean) => void;
}

const AddAchievementOption: FC<IProps> = ({ onSuccess }) => {
  const context = useContext(AchievementContext);
  const profile = context.userProfile;
  /* #region Database and ServerLess Functions Declarations */
  const [insertAnAchievement] = useAdminMutation<InsertAnAchievementOption, InsertAnAchievementOptionVariables>(
    INSERT_AN_ACHIEVEMENT_OPTION
  );
  /* #endregion */

  const onSave = useCallback(
    async (data: IDataToManipulate) => {
      try {
        const response = await insertAnAchievement({
          variables: {
            data: {
              title: data.title,
              description: data.description,
              evaluationScriptUrl: '', // This field is also mandatory while insert
              recordType: data.recordType as AchievementRecordType_enum,
              csvTemplateUrl: data.csvTemplateFile ? data.csvTemplateFile.data : null,
              AchievementOptionCourses: {
                data: data.courses.map((c) => ({ courseId: c.courseId })),
              },
              AchievementOptionMentors: {
                data: data.mentors.map((e) => ({ userId: e.userId })), // We need to change this field
              },
              showScoreAuthors: data.showScoreAuthors,
              achievementDocumentationTemplateId: data.achievementDocumentationTemplateId,
            },
          },
        });

        if (!response.errors && response.data?.insert_AchievementOption_one?.id) {
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
            data.evaluationScriptFile &&
            data.evaluationScriptFile.data &&
            data.evaluationScriptFile.data.trim().length > 0
          ) {
            await context.uploadFile(
              data.evaluationScriptFile,
              id,
              UploadFileTypes.SAVE_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT
            );
          }
        }
      } catch (error) {
        console.log(error);
        return { success: false, message: error.message } as ResponseToARequest;
      }

      onSuccess(true);
      return { success: true } as ResponseToARequest;
    },
    [onSuccess, context, insertAnAchievement]
  );

  const data: IDataToManipulate = {
    achievementDocumentationTemplateId: null,
    achievementOptionId: null,
    title: 'New Title',
    description: '',
    evaluationScriptUrl: '',
    showScoreAuthors: true,
    csvTemplateUrl: '',
    recordType: 'DOCUMENTATION' as AchievementRecordType_enum,
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
  return <FormToAddEditAchievementOption defaultData={data} onSaveCallBack={onSave} />;
};

export default AddAchievementOption;
