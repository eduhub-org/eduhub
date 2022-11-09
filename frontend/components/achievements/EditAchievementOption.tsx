import { FC, useCallback, useContext } from "react";
import { useAdminMutation } from "../../hooks/authedMutation";
import { AchievementOptionList_AchievementOption } from "../../queries/__generated__/AchievementOptionList";
import { AchievementContext } from "./AchievementOptionDashboard";
import {
  InsertAnAchievementOptionCourse,
  InsertAnAchievementOptionCourseVariables,
} from "../../queries/__generated__/InsertAnAchievementOptionCourse";
import {
  InsertAnAchievementOptionMentor,
  InsertAnAchievementOptionMentorVariables,
} from "../../queries/__generated__/InsertAnAchievementOptionMentor";
import {
  DELETE_AN_ACHIEVEMENT_OPTION_COURSE,
  DELETE_AN_ACHIEVEMENT_OPTION_MENTOR,
  INSERT_AN_ACHIEVEMENT_OPTION_COURSE,
  INSERT_AN_ACHIEVEMENT_OPTION_MENTOR,
} from "../../queries/mutateAchievement";
import {
  DeleteAnAchievementOptionCourseWithWhere,
  DeleteAnAchievementOptionCourseWithWhereVariables,
} from "../../queries/__generated__/DeleteAnAchievementOptionCourseWithWhere";
import {
  DeleteAnAchievementOptionMentorWithWhere,
  DeleteAnAchievementOptionMentorWithWhereVariables,
} from "../../queries/__generated__/DeleteAnAchievementOptionMentorWithWhere";
import {
  AchievementKeys,
  IDataToManipulate,
  IPayload,
  TempAchievementOptionCourse,
  TempAchievementOptionMentor,
  UploadFileTypes,
} from "../../helpers/achievement";
import { UploadFile } from "../../helpers/filehandling";
import AddEditAchievementOptionComponent from "./AddEditAchievementOptionComponent";

interface IProps {
  onSuccess: (success: boolean) => void;
  achievementOption: AchievementOptionList_AchievementOption;
}
const EditAchievementOption: FC<IProps> = (props) => {
  const context = useContext(AchievementContext);
  /* #region Database Operations */

  const [insertAnAchievementOptionMentor] = useAdminMutation<
    InsertAnAchievementOptionMentor,
    InsertAnAchievementOptionMentorVariables
  >(INSERT_AN_ACHIEVEMENT_OPTION_MENTOR);

  const queryAddAchievementOptionMentors = useCallback(
    async (achievementOptionId: number, expertId: number) => {
      try {
        const response = await insertAnAchievementOptionMentor({
          variables: {
            data: {
              achievementOptionId,
              expertId,
            },
          },
        });

        if (
          !response.errors &&
          response.data?.insert_AchievementOptionMentor_one?.id
        ) {
          props.onSuccess(true);
          return response.data.insert_AchievementOptionMentor_one.id;
        }
        props.onSuccess(false);
      } catch (error) {
        console.log(error);
      }
      return -1;
    },
    [insertAnAchievementOptionMentor, props]
  );

  const [insertIntoAchievementOptionCourses] = useAdminMutation<
    InsertAnAchievementOptionCourse,
    InsertAnAchievementOptionCourseVariables
  >(INSERT_AN_ACHIEVEMENT_OPTION_COURSE);

  const queryAddAchievementOptionCourse = useCallback(
    async (achievementOptionId: number, courseId: number) => {
      try {
        const res = await insertIntoAchievementOptionCourses({
          variables: {
            data: {
              achievementOptionId,
              courseId,
            },
          },
        });

        if (!res.errors && res.data?.insert_AchievementOptionCourse_one?.id) {
          props.onSuccess(true);
          return res.data.insert_AchievementOptionCourse_one.id;
        }
        props.onSuccess(false);
      } catch (error) {
        console.log(error);
      }
      return 0;
    },
    [insertIntoAchievementOptionCourses, props]
  );

  const [deleteMentorQuery] = useAdminMutation<
    DeleteAnAchievementOptionMentorWithWhere,
    DeleteAnAchievementOptionMentorWithWhereVariables
  >(DELETE_AN_ACHIEVEMENT_OPTION_MENTOR);

  const queryDeleteAnAchievementMentorFromDB = useCallback(
    async (achievementOptionId: number, expertId: number) => {
      try {
        const response = await deleteMentorQuery({
          variables: {
            where: {
              _and: [
                {
                  achievementOptionId: { _eq: achievementOptionId },
                },
                {
                  expertId: { _eq: expertId },
                },
              ],
            },
          },
        });
        if (
          !response.errors &&
          response.data?.delete_AchievementOptionMentor?.affected_rows
        ) {
          props.onSuccess(true);
          return response.data.delete_AchievementOptionMentor.affected_rows;
        }
        props.onSuccess(false);
      } catch (error) {
        console.log(error);
      }

      return 0;
    },
    [deleteMentorQuery, props]
  );

  const [deleteAnAchievementCourse] = useAdminMutation<
    DeleteAnAchievementOptionCourseWithWhere,
    DeleteAnAchievementOptionCourseWithWhereVariables
  >(DELETE_AN_ACHIEVEMENT_OPTION_COURSE);

  const queryDeleteAnAchievementCourseFromDB = useCallback(
    async (achievementOptionId: number, coureId: number) => {
      try {
        const response = await deleteAnAchievementCourse({
          variables: {
            where: {
              _and: [
                {
                  achievementOptionId: { _eq: achievementOptionId },
                },
                {
                  courseId: { _eq: coureId },
                },
              ],
            },
          },
        });
        if (
          !response.errors &&
          response.data?.delete_AchievementOptionCourse?.affected_rows
        ) {
          props.onSuccess(true);
          return response.data.delete_AchievementOptionCourse?.affected_rows;
        }
        props.onSuccess(false);
      } catch (error) {
        console.log(error);
      }
      return 0;
    },
    [deleteAnAchievementCourse, props]
  );

  /* #endregion */

  const onPropertyChanged = useCallback(
    async (
      achievementOptionId: number,
      payload: IPayload
    ): Promise<boolean> => {
      try {
        switch (payload.key) {
          case AchievementKeys.TITLE:
          case AchievementKeys.DESCRIPTION:
          case AchievementKeys.RECORD_TYPE: {
            const success = await context.queryUpdateAchievementOptions(
              achievementOptionId,
              payload,
              props.onSuccess
            );
            return success;
          }
          case AchievementKeys.ADD_A_MENTOR:
            const insertedID = await queryAddAchievementOptionMentors(
              achievementOptionId,
              payload.value as number
            );
            return insertedID > 0;
          case AchievementKeys.ADD_A_COURSE:
            const addedId = await queryAddAchievementOptionCourse(
              achievementOptionId,
              payload.value as number
            );
            return addedId > 0;
          case AchievementKeys.DELETE_A_MENTOR:
            const delId = await queryDeleteAnAchievementMentorFromDB(
              achievementOptionId,
              payload.value as number
            );
            return delId > 0;
          case AchievementKeys.DELETE_A_COURSE:
            const deletedId = await queryDeleteAnAchievementCourseFromDB(
              achievementOptionId,
              payload.value as number
            );
            return deletedId > 0;
          case AchievementKeys.DOCUMENT_TEMPLATE_FILE: {
            const uploadedResponse = await context.uploadFile(
              payload.value as UploadFile,
              achievementOptionId,
              UploadFileTypes.SAVE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE
            );
            return uploadedResponse ? true : false;
          }
          case AchievementKeys.EVALUTION_SCRIPT_FILE: {
            const uploadScriptFile = await context.uploadFile(
              payload.value as UploadFile,
              achievementOptionId,
              UploadFileTypes.SAVE_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT
            );
            return uploadScriptFile ? true : false;
          }
        }
      } catch (error) {}

      return false;
    },
    [
      props,
      context,
      queryAddAchievementOptionMentors,
      queryAddAchievementOptionCourse,
      queryDeleteAnAchievementMentorFromDB,
      queryDeleteAnAchievementCourseFromDB,
    ]
  );

  const ao: AchievementOptionList_AchievementOption = props.achievementOption;
  const data: IDataToManipulate = {
    achievementOptionId: ao.id,
    title: ao.title,
    description: ao.description,
    documentationTemplateUrl: ao.documentationTemplateUrl,
    evaluationScriptUrl: ao.evaluationScriptUrl,
    recordType: ao.recordType,
    experts: ao.AchievementOptionMentors.map(
      (m) =>
        ({
          userId: m.expertId,
          firstName: m.Expert.User.firstName,
          lastName: m.Expert.User.lastName,
        } as TempAchievementOptionMentor)
    ),
    courses: ao.AchievementOptionCourses.map(
      (c) =>
        ({
          id: c.id,
          courseId: c.courseId,
          programShortName: c.Course.Program ? c.Course.Program.shortTitle : "",
          title: c.Course.title,
        } as TempAchievementOptionCourse)
    ),
  };
  return (
    <AddEditAchievementOptionComponent
      defaultData={data}
      onPropertyChanged={onPropertyChanged}
    />
  );
};

export default EditAchievementOption;
