import { createContext, FC, ReactNode, useCallback } from 'react';
import { IUserProfile } from '../../hooks/user';
import { IPayload, UploadFileTypes } from '../../helpers/achievement';
import { UploadFile } from '../../helpers/filehandling';
import { Translate } from 'next-translate';
import { DELETE_AN_ACHIEVEMENT_OPTION, UPDATE_AN_ACHIEVEMENT_OPTION } from '../../queries/mutateAchievement';
import { AdminCourseList_Course } from '../../queries/__generated__/AdminCourseList';
import {
  DeleteAnAchievementOption,
  DeleteAnAchievementOptionVariables,
} from '../../queries/__generated__/DeleteAnAchievementOption';
import {
  UpdateAnAchievementOption,
  UpdateAnAchievementOptionVariables,
} from '../../queries/__generated__/UpdateAnAchievementOption';
import { useAdminMutation } from '../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';

export interface IPropsDashBoard {
  course?: AdminCourseList_Course;
  userId: string | undefined;
  userProfile: IUserProfile | undefined;
  achievementRecordTypes: string[];
  refetchAchievementOptions?: () => void;
  programID: number;
  setProgramID: (id: number) => void;
  setAlertMessage: (message: string) => void;
}

export interface IContext extends IPropsDashBoard {
  queryUpdateAchievementOptions: (
    id: number,
    payLoad: IPayload,
    onSuccess?: (success: boolean) => void
  ) => Promise<boolean>;
  uploadFile: (file: UploadFile, achievementOptionId: number, type: string) => Promise<string | undefined>;
  t: Translate;

  onClickDeleteAnAchievement: (id: number) => Promise<boolean>;
}
export const AchievementContext = createContext({} as IContext);
const fileUploadErrorMessage = 'incorrect secret';

const AchievementsHelper: FC<{
  context: IPropsDashBoard;
  children: ReactNode;
}> = ({ context, children }) => {
  const { t } = useTranslation();
  const [updateAchievement] = useAdminMutation<UpdateAnAchievementOption, UpdateAnAchievementOptionVariables>(
    UPDATE_AN_ACHIEVEMENT_OPTION
  );

  const queryUpdateAchievementOptions = useCallback(
    async (id: number, payLoad: IPayload, onSuccess?: (success: boolean) => void): Promise<boolean> => {
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
            return false;
          }
          onSuccess(true);
          return true;
        }
      } catch (error) {
        console.log(error);
      }
      return false;
    },
    [updateAchievement]
  );

  const [queryDeleteAnAchievement] = useAdminMutation<DeleteAnAchievementOption, DeleteAnAchievementOptionVariables>(
    DELETE_AN_ACHIEVEMENT_OPTION
  );

  const onClickDeleteAnAchievement = useCallback(
    async (id: number) => {
      try {
        const response = await queryDeleteAnAchievement({
          variables: { id: id },
        });
        if (response.errors) {
          console.log(response.errors);
          return false;
        }
        return true;
      } catch (error) {
        console.log(error);
        context.setAlertMessage(error.message);
      }
    },
    [queryDeleteAnAchievement, context]
  );

  const providerValue: IContext = {
    ...context,
    onClickDeleteAnAchievement,
    uploadFile: null,
    queryUpdateAchievementOptions,
    t,
  };
  return <AchievementContext.Provider value={providerValue}>{children}</AchievementContext.Provider>;
};

export default AchievementsHelper;
