import { FC, useCallback, useContext, useEffect, useState } from 'react';
import { useAdminMutation } from '../../hooks/authedMutation';
import { AchievementOptionList_AchievementOption } from '../../queries/__generated__/AchievementOptionList';
import {
  InsertAnAchievementOptionCourse,
  InsertAnAchievementOptionCourseVariables,
} from '../../queries/__generated__/InsertAnAchievementOptionCourse';
import {
  InsertAnAchievementOptionMentor,
  InsertAnAchievementOptionMentorVariables,
} from '../../queries/__generated__/InsertAnAchievementOptionMentor';
import {
  DELETE_AN_ACHIEVEMENT_OPTION_COURSE,
  DELETE_AN_ACHIEVEMENT_OPTION_MENTOR,
  INSERT_AN_ACHIEVEMENT_OPTION_COURSE,
  INSERT_AN_ACHIEVEMENT_OPTION_MENTOR,
} from '../../queries/mutateAchievement';
import {
  DeleteAnAchievementOptionCourseWithWhere,
  DeleteAnAchievementOptionCourseWithWhereVariables,
} from '../../queries/__generated__/DeleteAnAchievementOptionCourseWithWhere';
import {
  DeleteAnAchievementOptionMentorWithWhere,
  DeleteAnAchievementOptionMentorWithWhereVariables,
} from '../../queries/__generated__/DeleteAnAchievementOptionMentorWithWhere';
import {
  AchievementKeys,
  IDataToManipulate,
  ResponseToARequest,
  TempAchievementOptionCourse,
  TempAchievementOptionMentor,
  UploadFileTypes,
} from '../../helpers/achievement';
import FormToAddEditAchievementOption from './FormToAddEditAchievementOption';
import _ from 'lodash';
import { AchievementContext } from './AchievementsHelper';

import { CircularProgress } from '@material-ui/core';

interface IProps {
  onSuccess: (success: boolean) => void;
  achievementOption: AchievementOptionList_AchievementOption;
}
const EditAchievementOption: FC<IProps> = (props) => {
  const context = useContext(AchievementContext);
  const [data, setData] = useState(null as IDataToManipulate);

  /* #region Database Operations */

  const [insertAnAchievementOptionMentor] = useAdminMutation<
    InsertAnAchievementOptionMentor,
    InsertAnAchievementOptionMentorVariables
  >(INSERT_AN_ACHIEVEMENT_OPTION_MENTOR);

  const queryAddAchievementOptionMentors = useCallback(
    async (achievementOptionId: number, userId: string) => {
      try {
        const response = await insertAnAchievementOptionMentor({
          variables: {
            data: {
              achievementOptionId,
              userId,
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
    async (achievementOptionId: number, userId: string) => {
      try {
        const response = await deleteMentorQuery({
          variables: {
            where: {
              _and: [
                {
                  achievementOptionId: { _eq: achievementOptionId },
                },
                {
                  userId: { _eq: userId },
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
        context.setAlertMessage(error.message);
      }

      return 0;
    },
    [deleteMentorQuery, props, context]
  );

  const [deleteAnAchievementCourse] = useAdminMutation<
    DeleteAnAchievementOptionCourseWithWhere,
    DeleteAnAchievementOptionCourseWithWhereVariables
  >(DELETE_AN_ACHIEVEMENT_OPTION_COURSE);

  const queryDeleteAnAchievementCourseFromDB = useCallback(
    async (achievementOptionId: number, courseId: number) => {
      try {
        const response = await deleteAnAchievementCourse({
          variables: {
            where: {
              _and: [
                {
                  achievementOptionId: { _eq: achievementOptionId },
                },
                {
                  courseId: { _eq: courseId },
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
        context.setAlertMessage(error.message);
      }
      return 0;
    },
    [deleteAnAchievementCourse, props, context]
  );

  /* #endregion */

  const ao: AchievementOptionList_AchievementOption = props.achievementOption;
  useEffect(() => {
    const data: IDataToManipulate = {
      achievementOptionId: ao.id,
      title: ao.title,
      description: ao.description,
      documentationTemplateUrl: ao.documentationTemplateUrl,
      evaluationScriptUrl: ao.evaluationScriptUrl,
      recordType: ao.recordType,
      showScoreAuthors: ao.showScoreAuthors,
      csvTemplateUrl: ao.csvTemplateUrl,
      mentors: ao.AchievementOptionMentors.map(
        (m) =>
          ({
            userId: m.User?.id,
            firstName: m.User?.firstName,
            lastName: m.User?.lastName,
          } as TempAchievementOptionMentor)
      ),
      courses: ao.AchievementOptionCourses.map(
        (c) =>
          ({
            id: c.id,
            courseId: c.courseId,
            programShortName: c.Course.Program
              ? c.Course.Program.shortTitle
              : '',
            title: c.Course.title,
          } as TempAchievementOptionCourse)
      ),
    };
    setData(data);
  }, [
    ao.AchievementOptionCourses,
    ao.AchievementOptionMentors,
    ao.csvTemplateUrl,
    ao.description,
    ao.documentationTemplateUrl,
    ao.evaluationScriptUrl,
    ao.id,
    ao.recordType,
    ao.showScoreAuthors,
    ao.title,
  ]);

  /**
   * _.difference([2, 1], [2, 3]);
   * => [1]
   */
  const deletedAndNewIds = <T extends string | number>(
    oldIds: T[],
    newIds: T[]
  ) => {
    return {
      deletedIds: _.difference(oldIds, newIds),
      newIds: _.difference(newIds, oldIds),
    };
  };
  const changedKeys = (old: IDataToManipulate, newData: IDataToManipulate) => {
    const keys = _.union(_.keys(old), _.keys(newData));
    return _.filter(keys, (key: string) => old[key] !== newData[key]);
  };
  const onSave = useCallback(
    async (updatedData: IDataToManipulate) => {
      try {
        const cKeys = changedKeys(data, updatedData);
        const achievementOptionId = data.achievementOptionId;
        for (const key of cKeys) {
          switch (key) {
            case AchievementKeys.TITLE:
            case AchievementKeys.DESCRIPTION:
            case AchievementKeys.SHOW_SCORE_AUTHORS:
            case AchievementKeys.RECORD_TYPE:
              await context.queryUpdateAchievementOptions(
                data.achievementOptionId,
                {
                  key,
                  value: updatedData[key],
                }
              );
              break;
            case 'mentors': {
              try {
                const { deletedIds, newIds } = deletedAndNewIds(
                  data.mentors.map((t) => t.userId),
                  updatedData.mentors.map((m) => m.userId)
                );
                console.log(deletedIds, newIds);
                for (const mentorId of deletedIds) {
                  await queryDeleteAnAchievementMentorFromDB(
                    achievementOptionId,
                    mentorId
                  );
                }
                for (const mentor of newIds) {
                  await queryAddAchievementOptionMentors(
                    achievementOptionId,
                    mentor
                  );
                }
              } catch (error) {
                console.log(error);
              }
              break;
            }

            case 'courses': {
              try {
                const { deletedIds, newIds } = deletedAndNewIds(
                  data.courses.map((t) => t.courseId),
                  updatedData.courses.map((m) => m.courseId)
                );
                for (const deletedId of deletedIds) {
                  await queryDeleteAnAchievementCourseFromDB(
                    achievementOptionId,
                    deletedId
                  );
                }
                for (const newId of newIds) {
                  await queryAddAchievementOptionCourse(
                    achievementOptionId,
                    newId
                  );
                }
              } catch (error) {
                console.log(error);
              }
              break;
            }
            case AchievementKeys.DOCUMENT_TEMPLATE_FILE:
              if (updatedData.documentTemplateFile) {
                await context.uploadFile(
                  updatedData.documentTemplateFile,
                  achievementOptionId,
                  UploadFileTypes.SAVE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE
                );
              }
              break;

            case AchievementKeys.EVALUATION_SCRIPT_FILE:
              if (updatedData.evaluationScriptFile) {
                await context.uploadFile(
                  updatedData.evaluationScriptFile,
                  achievementOptionId,
                  UploadFileTypes.SAVE_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT
                );
              }
              break;
            case AchievementKeys.CSV_TEMPLATE_FILE:
              if (updatedData.csvTemplateFile) {
                await context.queryUpdateAchievementOptions(
                  data.achievementOptionId,
                  {
                    key: AchievementKeys.CSV_TEMPLATE_URL,
                    value: updatedData[key].data,
                  }
                );
              }
              break;
          }
        }
        props.onSuccess(true);
        return { success: true } as ResponseToARequest;
      } catch (error) {
        console.log(error);
        return { success: false, message: error.message } as ResponseToARequest;
      }
    },
    [
      context,
      data,
      props,
      queryAddAchievementOptionCourse,
      queryAddAchievementOptionMentors,
      queryDeleteAnAchievementCourseFromDB,
      queryDeleteAnAchievementMentorFromDB,
    ]
  );
  if (!data) return <CircularProgress />;

  return (
    <>
      {data && (
        <FormToAddEditAchievementOption
          defaultData={data}
          onSaveCallBack={onSave}
        />
      )}
    </>
  );
};

export default EditAchievementOption;
