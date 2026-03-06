import { FC, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { AchievementOptionList_AchievementOption } from '../../../queries/__generated__/AchievementOptionList';
import {
  INSERT_AN_ACHIEVEMENT_OPTION_MENTOR,
  DELETE_AN_ACHIEVEMENT_OPTION_MENTOR_BY_PK,
  INSERT_AN_ACHIEVEMENT_OPTION_COURSE,
  DELETE_AN_ACHIEVEMENT_OPTION_COURSE_BY_PK,
  UPDATE_ACHIEVEMENT_OPTION_DESCRIPTION,
  UPDATE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE,
} from '../../../queries/mutateAchievement';
import { ACHIEVEMENT_DOCUMENTATION_TEMPLATES } from '../../../queries/achievementDocumentationTemplate';
import { AchievementDocumentationTemplates } from '../../../queries/__generated__/AchievementDocumentationTemplates';
import {
  InsertAnAchievementOptionMentor,
  InsertAnAchievementOptionMentorVariables,
} from '../../../queries/__generated__/InsertAnAchievementOptionMentor';
import {
  DeleteAnAchievementOptionMentor,
  DeleteAnAchievementOptionMentorVariables,
} from '../../../queries/__generated__/DeleteAnAchievementOptionMentor';
import {
  InsertAnAchievementOptionCourse,
  InsertAnAchievementOptionCourseVariables,
} from '../../../queries/__generated__/InsertAnAchievementOptionCourse';
import {
  DeleteAnAchievementOptionCourse,
  DeleteAnAchievementOptionCourseVariables,
} from '../../../queries/__generated__/DeleteAnAchievementOptionCourse';
import { UserSelectionWithFilter_User } from '../../../queries/__generated__/UserSelectionWithFilter';
import { AdminCourseList_Course } from '../../../queries/__generated__/AdminCourseList';
import { SelectUserDialog } from '../../common/dialogs/SelectUserDialog';
import { SelectCourseDialog } from '../../common/dialogs/SelectCourseDialog';
import InputField from '../../inputs/InputField';
import DropDownSelector from '../../inputs/DropDownSelector';
import { makeFullName } from '../../../helpers/util';
import useErrorHandler from '../../../hooks/useErrorHandler';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import ManagedItemList from '../../common/ManagedItemList';

interface ExpandableAchievementOptionRowProps {
  achievementOption: AchievementOptionList_AchievementOption;
}

const ExpandableAchievementOptionRow: FC<ExpandableAchievementOptionRowProps> = ({ achievementOption }) => {
  const t = useTranslations('manageAchievementOptions');
  const tCommon = useTranslations('common');
  const { error, handleError, resetError } = useErrorHandler();

  // Load documentation templates for dropdown
  const { data: templatesData } = useAdminQuery<AchievementDocumentationTemplates>(
    ACHIEVEMENT_DOCUMENTATION_TEMPLATES,
    {
      variables: {
        limit: 100,
        offset: 0,
      },
    }
  );

  const templates = templatesData?.AchievementDocumentationTemplate || [];
  const templateOptions = templates.map((template) => ({
    value: template.id.toString(),
    label: template.title,
  }));

  // Mentor mutations
  const [insertMentor] = useAdminMutation<InsertAnAchievementOptionMentor, InsertAnAchievementOptionMentorVariables>(
    INSERT_AN_ACHIEVEMENT_OPTION_MENTOR,
    {
      refetchQueries: ['AchievementOptionList'],
    }
  );

  const [deleteMentor] = useAdminMutation<
    DeleteAnAchievementOptionMentor,
    DeleteAnAchievementOptionMentorVariables
  >(DELETE_AN_ACHIEVEMENT_OPTION_MENTOR_BY_PK, {
    refetchQueries: ['AchievementOptionList'],
  });

  // Course mutations
  const [insertCourse] = useAdminMutation<InsertAnAchievementOptionCourse, InsertAnAchievementOptionCourseVariables>(
    INSERT_AN_ACHIEVEMENT_OPTION_COURSE,
    {
      refetchQueries: ['AchievementOptionList'],
    }
  );

  const [deleteCourse] = useAdminMutation<
    DeleteAnAchievementOptionCourse,
    DeleteAnAchievementOptionCourseVariables
  >(DELETE_AN_ACHIEVEMENT_OPTION_COURSE_BY_PK, {
    refetchQueries: ['AchievementOptionList'],
  });

  // Mentor management handlers
  const addMentorHandler = useCallback(
    async (confirmed: boolean, user: UserSelectionWithFilter_User | null) => {
      if (!confirmed || user == null) {
        return;
      }

      try {
        await insertMentor({
          variables: {
            data: {
              achievementOptionId: achievementOption.id,
              userId: user.id,
            },
          },
        });
      } catch (err: any) {
        handleError(err?.message || tCommon('operation_failed'));
      }
    },
    [achievementOption, insertMentor, handleError, tCommon]
  );

  const deleteMentorHandler = useCallback(
    async (mentor: typeof achievementOption.AchievementOptionMentors[0]) => {
      try {
        await deleteMentor({
          variables: {
            id: mentor.id,
          },
        });
      } catch (err: any) {
        handleError(err?.message || tCommon('operation_failed'));
      }
    },
    [deleteMentor, handleError, tCommon, achievementOption]
  );

  // Course management handlers
  const addCourseHandler = useCallback(
    async (confirmed: boolean, course: AdminCourseList_Course | null) => {
      if (!confirmed || course == null) {
        return;
      }

      try {
        await insertCourse({
          variables: {
            data: {
              achievementOptionId: achievementOption.id,
              courseId: course.id,
            },
          },
        });
      } catch (err: any) {
        handleError(err?.message || tCommon('operation_failed'));
      }
    },
    [achievementOption, insertCourse, handleError, tCommon]
  );

  const deleteCourseHandler = useCallback(
    async (aoCourse: typeof achievementOption.AchievementOptionCourses[0]) => {
      try {
        await deleteCourse({
          variables: {
            id: aoCourse.id,
          },
        });
      } catch (err: any) {
        handleError(err?.message || tCommon('operation_failed'));
      }
    },
    [deleteCourse, handleError, tCommon, achievementOption]
  );

  return (
    <div className="w-full flex-1 min-w-0">
      <div className="bg-fill-primary text-label-primary light p-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Left Column */}
          <div className="space-y-4 w-full min-w-0">
            {/* Description */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4">
              <div className="mb-2">
                <label className="text-sm font-medium text-label-primary">
                  {tCommon('project-description')}
                </label>
              </div>
              <InputField
                variant="material"
                type="textarea"
                placeholder={t('description.placeholder')}
                itemId={achievementOption.id}
                value={achievementOption.description || ''}
                updateValueMutation={UPDATE_ACHIEVEMENT_OPTION_DESCRIPTION}
                refetchQueries={['AchievementOptionList']}
                maxLength={3000}
              />
            </div>

            {/* Documentation Template */}
            {(achievementOption.recordType === 'DOCUMENTATION' || achievementOption.recordType === 'ONLINE_COURSE') && (
              <div className="bg-fill-primary border border-border-primary rounded-lg p-4">
                <div className="mb-2">
                  <label className="text-sm font-medium text-label-primary">
                    {tCommon('achievement-documentation-template')}
                  </label>
                </div>
                <DropDownSelector
                  variant="material"
                  placeholder={t('documentation_template.placeholder')}
                  helpText={t('documentation_template.help_text')}
                  value={achievementOption.achievementDocumentationTemplateId?.toString() || ''}
                  options={templateOptions}
                  updateValueMutation={UPDATE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE}
                  identifierVariables={{ itemId: achievementOption.id }}
                  refetchQueries={['AchievementOptionList']}
                  nullable={true}
                />
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4 w-full min-w-0">
            {/* Mentors */}
            <ManagedItemList
              title={tCommon('project-mentors')}
              items={achievementOption.AchievementOptionMentors}
              renderItem={(mentor) => ({
                label: makeFullName(mentor.User.firstName, mentor.User.lastName ?? ''),
                sublabel: mentor.User.email ? `(${mentor.User.email})` : undefined,
              })}
              getItemKey={(mentor) => mentor.id}
              onDelete={deleteMentorHandler}
              onAdd={addMentorHandler}
              addButtonLabel={t('add_mentor')}
              removeAriaLabel={t('remove_mentor')}
              SelectionDialog={SelectUserDialog}
              dialogTitle={t('add_mentor')}
              checkDuplicate={(mentor, user) => mentor.User.id === user.id}
            />

            {/* Courses */}
            <ManagedItemList
              title={tCommon('courses')}
              items={achievementOption.AchievementOptionCourses}
              renderItem={(aoCourse) => ({
                label: aoCourse.Course.title,
                sublabel: aoCourse.Course.Program?.shortTitle ?? undefined,
              })}
              getItemKey={(aoCourse) => aoCourse.id}
              onDelete={deleteCourseHandler}
              onAdd={addCourseHandler}
              addButtonLabel={t('add_course')}
              removeAriaLabel={tCommon('remove_course')}
              SelectionDialog={SelectCourseDialog}
              dialogTitle={t('add_course')}
              checkDuplicate={(aoCourse, course) => aoCourse.courseId === course.id}
            />
          </div>
        </div>
      </div>

      {/* Error Message Dialog */}
      {error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}
    </div>
  );
};

export default ExpandableAchievementOptionRow;
