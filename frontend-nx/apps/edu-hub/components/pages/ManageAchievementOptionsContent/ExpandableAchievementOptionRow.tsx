import { FC, useCallback, useState } from 'react';
import { MdAddCircle } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { AchievementOptionList_AchievementOption } from '../../../queries/__generated__/AchievementOptionList';
import {
  INSERT_AN_ACHIEVEMENT_OPTION_MENTOR,
  DELETE_AN_ACHIEVEMENT_OPTION_MENTOR_BY_PK,
  INSERT_AN_ACHIEVEMENT_OPTION_COURSE,
  DELETE_AN_ACHIEVEMENT_OPTION_COURSE_BY_PK,
} from '../../../queries/mutateAchievement';
import {
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
  DeleteAnAchievementOptionMentorByPk,
  DeleteAnAchievementOptionMentorByPkVariables,
} from '../../../queries/__generated__/DeleteAnAchievementOptionMentorByPk';
import {
  InsertAnAchievementOptionCourse,
  InsertAnAchievementOptionCourseVariables,
} from '../../../queries/__generated__/InsertAnAchievementOptionCourse';
import {
  DeleteAnAchievementOptionCourseByPk,
  DeleteAnAchievementOptionCourseByPkVariables,
} from '../../../queries/__generated__/DeleteAnAchievementOptionCourseByPk';
import { UserSelectionWithFilter_User } from '../../../queries/__generated__/UserSelectionWithFilter';
import { AdminCourseList_Course } from '../../../queries/__generated__/AdminCourseList';
import { SelectUserDialog } from '../../common/dialogs/SelectUserDialog';
import { SelectCourseDialog } from '../../common/dialogs/SelectCourseDialog';
import InputField from '../../inputs/InputField';
import DropDownSelector from '../../inputs/DropDownSelector';
import { makeFullName } from '../../../helpers/util';
import useErrorHandler from '../../../hooks/useErrorHandler';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';

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
  const templateOptions = [
    { value: '', label: tCommon('dropdown_selector.none_option') },
    ...templates.map((template) => ({
      value: template.id.toString(),
      label: template.title,
    })),
  ];

  // Mentors management state
  const [mentorDialogOpen, setMentorDialogOpen] = useState(false);

  // Courses management state
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);

  // Mentor mutations
  const [insertMentor] = useAdminMutation<InsertAnAchievementOptionMentor, InsertAnAchievementOptionMentorVariables>(
    INSERT_AN_ACHIEVEMENT_OPTION_MENTOR,
    {
      refetchQueries: ['AchievementOptionList'],
    }
  );

  const [deleteMentor] = useAdminMutation<
    DeleteAnAchievementOptionMentorByPk,
    DeleteAnAchievementOptionMentorByPkVariables
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
    DeleteAnAchievementOptionCourseByPk,
    DeleteAnAchievementOptionCourseByPkVariables
  >(DELETE_AN_ACHIEVEMENT_OPTION_COURSE_BY_PK, {
    refetchQueries: ['AchievementOptionList'],
  });

  // Mentor management functions
  const openMentorDialog = useCallback(() => {
    setMentorDialogOpen(true);
  }, []);

  const closeMentorDialog = useCallback(() => {
    setMentorDialogOpen(false);
  }, []);

  const addMentorHandler = useCallback(
    async (confirmed: boolean, user: UserSelectionWithFilter_User | null) => {
      if (!confirmed || user == null) {
        closeMentorDialog();
        return;
      }

      // Check if user is already a mentor
      if (achievementOption.AchievementOptionMentors.some((mentor) => mentor.User.id === user.id)) {
        closeMentorDialog();
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
      } finally {
        closeMentorDialog();
      }
    },
    [achievementOption, insertMentor, closeMentorDialog, handleError, tCommon]
  );

  const deleteMentorHandler = useCallback(
    async (mentorId: number) => {
      try {
        await deleteMentor({
          variables: {
            id: mentorId,
          },
        });
      } catch (err: any) {
        handleError(err?.message || tCommon('operation_failed'));
      }
    },
    [deleteMentor, handleError, tCommon]
  );

  // Course management functions
  const openCourseDialog = useCallback(() => {
    setCourseDialogOpen(true);
  }, []);

  const closeCourseDialog = useCallback(() => {
    setCourseDialogOpen(false);
  }, []);

  const addCourseHandler = useCallback(
    async (confirmed: boolean, course: AdminCourseList_Course | null) => {
      if (!confirmed || course == null) {
        closeCourseDialog();
        return;
      }

      // Check if course is already linked
      if (achievementOption.AchievementOptionCourses.some((aoCourse) => aoCourse.courseId === course.id)) {
        closeCourseDialog();
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
      } finally {
        closeCourseDialog();
      }
    },
    [achievementOption, insertCourse, closeCourseDialog, handleError, tCommon]
  );

  const deleteCourseHandler = useCallback(
    async (courseId: number) => {
      const courseLink = achievementOption.AchievementOptionCourses.find((aoCourse) => aoCourse.courseId === courseId);
      if (!courseLink) return;

      try {
        await deleteCourse({
          variables: {
            id: courseLink.id,
          },
        });
      } catch (err: any) {
        handleError(err?.message || tCommon('operation_failed'));
      }
    },
    [achievementOption, deleteCourse, handleError, tCommon]
  );

  return (
    <div className="w-full flex-1 min-w-0">
      <div className="bg-edu-course-list p-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Left Column */}
          <div className="space-y-4 w-full min-w-0">
            {/* Description */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="mb-2">
                <label className="text-sm font-medium text-gray-700">
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
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="mb-2">
                  <label className="text-sm font-medium text-gray-700">
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
                  nullable={false}
                />
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4 w-full min-w-0">
            {/* Mentors */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">{tCommon('project-mentors')}</h4>
              <div className="space-y-2">
                {achievementOption.AchievementOptionMentors.map((mentor) => (
                  <div key={mentor.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex-1">
                      <div className="font-medium">
                        {makeFullName(mentor.User.firstName, mentor.User.lastName ?? '')}
                        {mentor.User.email && (
                          <span className="text-sm text-gray-600 ml-1">({mentor.User.email})</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMentorHandler(mentor.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={openMentorDialog}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 p-2 w-full rounded hover:bg-blue-50 transition-colors"
                >
                  <MdAddCircle className="w-5 h-5" />
                  <span>{t('add_mentor')}</span>
                </button>
              </div>
            </div>

            {/* Courses */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">{tCommon('courses')}</h4>
              <div className="space-y-2">
                {achievementOption.AchievementOptionCourses.map((aoCourse) => (
                  <div key={aoCourse.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex-1">
                      <div className="font-medium">{aoCourse.Course.title}</div>
                      {aoCourse.Course.Program?.shortTitle && (
                        <div className="text-sm text-gray-600 mt-1">{aoCourse.Course.Program.shortTitle}</div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteCourseHandler(aoCourse.courseId)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={openCourseDialog}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 p-2 w-full rounded hover:bg-blue-50 transition-colors"
                >
                  <MdAddCircle className="w-5 h-5" />
                  <span>{t('add_course')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mentor Selection Dialog */}
      {mentorDialogOpen && (
        <SelectUserDialog
          onClose={addMentorHandler}
          open={mentorDialogOpen}
          title={t('add_mentor')}
        />
      )}

      {/* Course Selection Dialog */}
      {courseDialogOpen && (
        <SelectCourseDialog
          onClose={addCourseHandler}
          open={courseDialogOpen}
          title={t('add_course')}
        />
      )}

      {/* Error Message Dialog */}
      {error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}
    </div>
  );
};

export default ExpandableAchievementOptionRow;
