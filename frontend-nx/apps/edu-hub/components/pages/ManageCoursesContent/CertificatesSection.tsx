import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useManageMutation } from '../../../hooks/authedMutation';
import useErrorHandler from '../../../hooks/useErrorHandler';
import {
  UPDATE_COURSE_ECTS,
  UPDATE_COURSE_LEARNING_GOALS,
  UPDATE_COURSE_MAX_MISSED_SESSION,
  UPDATE_COURSE_PROJECT_PROPOSALS_ENABLED,
  UPDATE_COURSE_PROJECT_SUBMISSION_DEADLINE,
} from '../../../queries/course';
import { INSERT_COURSE_DEGREE_TAG, DELETE_COURSE_DEGREE_TAG } from '../../../queries/courseDegree';
import { AdminCourseList_Course } from '../../../queries/__generated__/AdminCourseList';
import CheckboxSelector from '../../inputs/CheckboxSelector';
import InputField from '../../inputs/InputField';
import RadioSelector, { RadioSelectorOption } from '../../inputs/RadioSelector';
import DatePicker from '../../inputs/DatePicker';
import TagSelector from '../../inputs/TagSelector';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { submissionDeadlineToCalendarDate } from '../CourseContent/Projects/projectEffectiveSubmissionDeadline';

interface CertificatesSectionProps {
  course: AdminCourseList_Course;
  isEventCourse: boolean;
  degreeCourses: { id: number; name: string }[];
  onSetAttendanceCertificatePossible: (c: AdminCourseList_Course, isPossible: boolean) => any;
  onSetAchievementCertificatePossible: (c: AdminCourseList_Course, isPossible: boolean) => any;
}

/** Learning goals are printed on the achievement certificate, so they are edited next to it. */
export const LearningGoalsField: FC<{ course: AdminCourseList_Course }> = ({ course }) => {
  const t = useTranslations('manageCourses');
  return (
    <div className="[&_.text-label-disabled]:text-label-primary">
      <InputField
        variant="eduhub"
        type="textarea"
        value={course.learningGoals ?? ''}
        updateValueMutation={UPDATE_COURSE_LEARNING_GOALS}
        refetchQueries={['AdminCourseList']}
        itemId={course.id}
        label={t('learning_goals.label')}
        placeholder={t('learning_goals.placeholder')}
        helpText={`${t('learning_goals.certificate_hint')} ${t('learning_goals.help_text')}`}
        maxLength={500}
        className="h-32 !text-label-primary"
      />
    </div>
  );
};

/**
 * Everything the certificates of an offering depend on, behind one main switch: most events
 * award no certificate, so by default the card is just that switch.
 */
const CertificatesSection: FC<CertificatesSectionProps> = ({
  course,
  isEventCourse,
  degreeCourses,
  onSetAttendanceCertificatePossible,
  onSetAchievementCertificatePossible,
}) => {
  const t = useTranslations('manageCourses');
  const { error, handleError, resetError } = useErrorHandler();

  const hasCertificate = Boolean(course.attendanceCertificatePossible || course.achievementCertificatePossible);
  // A course may switch the card on before choosing which certificate it awards.
  const [expanded, setExpanded] = useState(hasCertificate);
  const showDetails = hasCertificate || expanded;

  const handleToggleCertificates = useCallback(
    (enabled: boolean) => {
      setExpanded(enabled);
      if (enabled) {
        // An event can only award attendance, so there is nothing left to choose.
        if (isEventCourse) onSetAttendanceCertificatePossible(course, true);
        return;
      }
      if (course.attendanceCertificatePossible) onSetAttendanceCertificatePossible(course, false);
      if (course.achievementCertificatePossible) onSetAchievementCertificatePossible(course, false);
    },
    [course, isEventCourse, onSetAttendanceCertificatePossible, onSetAchievementCertificatePossible]
  );

  const [updateProjectProposalsEnabled] = useManageMutation(UPDATE_COURSE_PROJECT_PROPOSALS_ENABLED, {
    refetchQueries: ['AdminCourseList'],
  });

  // Tri-state: no course override (inherit the program default), explicitly
  // enabled, or explicitly disabled.
  const projectProposalsValue =
    course.projectProposalsEnabled == null ? 'inherit' : course.projectProposalsEnabled ? 'enabled' : 'disabled';

  const projectProposalsOptions = useMemo<RadioSelectorOption[]>(
    () => [
      {
        value: 'inherit',
        label: t(
          course.Program?.projectProposalsEnabledByDefault
            ? 'project_options.proposals_enabled.option_inherit_yes'
            : 'project_options.proposals_enabled.option_inherit_no'
        ),
      },
      { value: 'enabled', label: t('project_options.proposals_enabled.option_enabled') },
      { value: 'disabled', label: t('project_options.proposals_enabled.option_disabled') },
    ],
    [course.Program?.projectProposalsEnabledByDefault, t]
  );

  const handleSetProjectProposalsEnabled = useCallback(
    async (value: string) => {
      try {
        await updateProjectProposalsEnabled({
          variables: { itemId: course.id, value: value === 'inherit' ? null : value === 'enabled' },
        });
      } catch (err) {
        handleError(err instanceof Error ? err.message : String(err));
      }
    },
    [course.id, updateProjectProposalsEnabled, handleError]
  );

  const projectSubmissionDeadlineValue = useMemo(
    () => submissionDeadlineToCalendarDate(course.projectSubmissionDeadline),
    [course.projectSubmissionDeadline]
  );

  const currentCourseDegrees = course.CourseDegrees.map((degree) => ({
    id: degree.degreeCourseId,
    name: degree.DegreeCourse.title,
  }));

  return (
    <div className="bg-fill-primary border border-border-primary rounded-lg p-4 space-y-3">
      <div>
        <CheckboxSelector
          variant="switch"
          label={t('certificates.enable')}
          checked={showDetails}
          onValueUpdated={handleToggleCertificates}
        />
        {!showDetails && <p className="text-xs text-label-secondary -mt-2">{t('certificates.disabled_hint')}</p>}
      </div>

      {showDetails && (
        <div className="space-y-4 border-t border-border-primary pt-3">
          <div className="space-y-1">
            <CheckboxSelector
              variant="switch"
              label={t('possible_certificates.attendance_certificate')}
              checked={Boolean(course.attendanceCertificatePossible)}
              onValueUpdated={(value: boolean) => onSetAttendanceCertificatePossible(course, value)}
            />
            {/* An event awards attendance, not an achievement, so ECTS and the project
                settings that hang off the achievement certificate do not apply to it. */}
            {!isEventCourse && (
              <CheckboxSelector
                variant="switch"
                label={t('possible_certificates.achievement_certificate')}
                checked={Boolean(course.achievementCertificatePossible)}
                onValueUpdated={(value: boolean) => onSetAchievementCertificatePossible(course, value)}
              />
            )}
          </div>

          {!isEventCourse && course.achievementCertificatePossible && (
            <div className="space-y-4 sm:ml-4">
              <InputField
                variant="material"
                type="ects"
                label={t('ects.label')}
                placeholder={t('ects.label')}
                itemId={course.id}
                value={course.ects || ''}
                updateValueMutation={UPDATE_COURSE_ECTS}
                refetchQueries={['AdminCourseList']}
                helpText={t('ects.help_text')}
              />

              <div>
                <p className="text-sm font-medium text-label-primary mb-1">
                  {t('project_options.proposals_enabled.label')}
                </p>
                <p className="text-xs text-label-secondary mb-2">{t('project_options.proposals_enabled.help_text')}</p>
                <RadioSelector
                  layout="inline"
                  name={`project-proposals-${course.id}`}
                  value={projectProposalsValue}
                  options={projectProposalsOptions}
                  onValueChange={handleSetProjectProposalsEnabled}
                />
              </div>

              <DatePicker
                variant="material"
                label={t('project_options.submission_deadline.label')}
                helpText={t('project_options.submission_deadline.help_text')}
                itemId={course.id}
                value={projectSubmissionDeadlineValue}
                updateValueMutation={UPDATE_COURSE_PROJECT_SUBMISSION_DEADLINE}
                identifierVariables={{ itemId: course.id }}
                dateFieldName="value"
                refetchQueries={['AdminCourseList']}
              />

              <LearningGoalsField course={course} />
            </div>
          )}

          <InputField
            variant="material"
            type="number"
            label={t('max_missed_sessions.label')}
            placeholder={t('max_missed_sessions.label')}
            itemId={course.id}
            value={String(course.maxMissedSessions ?? 2)}
            updateValueMutation={UPDATE_COURSE_MAX_MISSED_SESSION}
            refetchQueries={['AdminCourseList']}
            helpText={t('max_missed_sessions.help_text')}
            min={0}
          />

          <TagSelector
            variant="material"
            label={t('course_degree_title.label')}
            placeholder={t('course_degree_title.placeholder')}
            itemId={course.id}
            values={currentCourseDegrees}
            options={degreeCourses}
            insertValueMutation={INSERT_COURSE_DEGREE_TAG}
            deleteValueMutation={DELETE_COURSE_DEGREE_TAG}
            refetchQueries={['AdminCourseList']}
          />
        </div>
      )}

      {error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}
    </div>
  );
};

export default CertificatesSection;
