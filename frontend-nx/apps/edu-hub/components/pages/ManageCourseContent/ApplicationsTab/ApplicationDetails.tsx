import { FC, ReactNode, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Tooltip } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { MdArrowDownward, MdCalendarToday, MdMailOutline, MdOutlineBusiness } from 'react-icons/md';

import Dot, { DotColor } from '../../../common/Dot';
import { EnrollmentHistory } from '../../../common/EnrollmentHistory';
import { ExpandedRowProps } from '../../../common/TableGrid/types';
import { MotivationRating_enum } from '../../../../__generated__/globalTypes';
import { ManagedCourseApplications_Course_by_pk_CourseEnrollments } from '../../../../queries/__generated__/ManagedCourseApplications';
import { ClampedText } from './ClampedText';
import { FormbricksResponsesDisplay } from './FormbricksResponsesDisplay';
import { RegistrationFeatures } from './registrationConfig';

type ApplicationEnrollment = ManagedCourseApplications_Course_by_pk_CourseEnrollments;

/** Rating buttons in display order, each with its keyboard shortcut. */
export const RATING_OPTIONS: { value: MotivationRating_enum; color: DotColor; labelKey: string; shortcut: string }[] = [
  { value: MotivationRating_enum.INVITE, color: 'lightgreen', labelKey: 'rating.invite', shortcut: '1' },
  { value: MotivationRating_enum.REVIEW, color: 'orange', labelKey: 'rating.unclear', shortcut: '2' },
  { value: MotivationRating_enum.DECLINE, color: 'red', labelKey: 'rating.reject', shortcut: '3' },
  { value: MotivationRating_enum.UNRATED, color: 'grey', labelKey: 'rating.not_rated', shortcut: '0' },
];

/** Typing in a field must never rate or jump. */
const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

const SectionHeading: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-label-secondary">
    {children}
  </div>
);

const HelpIcon: FC<{ title: string }> = ({ title }) => (
  <Tooltip title={title} placement="top">
    <HelpOutline className="cursor-pointer text-label-disabled" sx={{ fontSize: 14 }} aria-label={title} />
  </Tooltip>
);

interface Props extends Omit<ExpandedRowProps<ApplicationEnrollment>, 'row'> {
  enrollment: ApplicationEnrollment;
  features: RegistrationFeatures;
  /** Formbricks survey of the course (or the program default); null shows the motivation letter. */
  surveyUrl: string | null;
  onRate: (rating: MotivationRating_enum) => void;
  displayDate: (date: string | null) => string;
}

/**
 * Expanded application row. Desktop: the answers as a reading column, with rating, contact and
 * history in a side panel. Below lg the side panel is stacked in reading order: who, what they
 * wrote, then the rating with a button to the next application.
 */
export const ApplicationDetails: FC<Props> = ({
  enrollment,
  features,
  surveyUrl,
  onRate,
  displayDate,
  isActive,
  expandNext,
  expandPrevious,
}) => {
  const t = useTranslations('manageCourse');
  const tHistory = useTranslations('enrollmentHistory');
  const hasAnswers = features.hasQuestionnaire;
  const hasRating = features.hasApplicationProcess;
  // Desktop side panel: rating on top, then contact and history.
  const sideHasRating = hasAnswers && hasRating;
  const orgName = enrollment.User.Organization?.name ?? enrollment.User.organizationName;

  useEffect(() => {
    if (!isActive) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      const rating = hasRating ? RATING_OPTIONS.find((option) => option.shortcut === key) : undefined;
      if (rating) onRate(rating.value);
      else if (key === 'j' && expandNext) expandNext();
      else if (key === 'k' && expandPrevious) expandPrevious();
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive, hasRating, onRate, expandNext, expandPrevious]);

  const contact = (
    <div className={`min-w-0 space-y-2 text-sm ${sideHasRating ? 'lg:border-t lg:border-table-divider lg:pt-5' : ''}`}>
      <SectionHeading>{t('application_details.contact')}</SectionHeading>
      <div className="flex items-center gap-2">
        <MdMailOutline className="flex-shrink-0 text-label-secondary" />
        <a href={`mailto:${enrollment.User.email}`} className="min-w-0 break-all underline">
          {enrollment.User.email}
        </a>
      </div>
      {orgName && (
        <div className="flex items-center gap-2">
          <MdOutlineBusiness className="flex-shrink-0 text-label-secondary" />
          <span className="min-w-0 break-words">{orgName}</span>
        </div>
      )}
      {enrollment.created_at && (
        <div className="flex items-center gap-2">
          <MdCalendarToday className="flex-shrink-0 text-label-secondary" />
          <span>
            {t(hasRating ? 'application_details.applied_on' : 'application_details.registered_on', {
              date: displayDate(enrollment.created_at),
            })}
          </span>
        </div>
      )}
    </div>
  );

  const history = (
    <div className={`min-w-0 ${hasAnswers ? 'lg:border-t lg:border-table-divider lg:pt-5' : ''}`}>
      <SectionHeading>
        {tHistory('label')}
        <HelpIcon title={tHistory('legend')} />
      </SectionHeading>
      <EnrollmentHistory
        enrollments={enrollment.User.CourseEnrollments}
        excludeCourseId={enrollment.courseId}
        showLabel={false}
      />
    </div>
  );

  const answers = hasAnswers && (
    <div className="min-w-0 px-4 py-4 md:px-6 lg:py-6 lg:pr-10 [grid-area:answers]">
      {surveyUrl ? (
        <FormbricksResponsesDisplay
          storedResponse={enrollment.questionnaireResponse}
          courseId={enrollment.courseId}
          userId={enrollment.userId}
          enrollmentId={enrollment.id}
          formbricksEnrollmentSurveyUrl={surveyUrl}
        />
      ) : (
        <>
          <SectionHeading>{t('application')}</SectionHeading>
          <div className="border-t border-table-divider py-4">
            {enrollment.motivationLetter ? (
              <ClampedText text={enrollment.motivationLetter} className="text-[15px] leading-relaxed" />
            ) : (
              '-'
            )}
          </div>
        </>
      )}
    </div>
  );

  const nextKey = features.tabNameKey === 'applications' ? 'next_application' : 'next_registration';
  const decision = (hasRating || expandNext) && (
    <div
      className={`space-y-3 border-t border-table-divider bg-bg-secondary p-4 md:px-6 [grid-area:decision] ${
        sideHasRating ? 'lg:border-l lg:border-t-0 lg:px-5 lg:pt-5 lg:pb-5' : 'lg:hidden'
      }`}
    >
      {hasRating && (
        <>
          <SectionHeading>
            {t('evaluation')}
            <HelpIcon title={t('application_status_tooltip')} />
          </SectionHeading>
          <div className={`grid grid-cols-2 gap-2 md:grid-cols-4 ${hasAnswers ? 'lg:grid-cols-1' : ''}`}>
            {RATING_OPTIONS.map((option) => {
              const isActiveRating = enrollment.motivationRating === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onRate(option.value)}
                  aria-pressed={isActiveRating}
                  aria-keyshortcuts={option.shortcut}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm transition-colors lg:justify-between ${
                    isActiveRating
                      ? 'border-label-primary bg-label-primary font-semibold text-fill-primary'
                      : 'border-border-primary bg-fill-primary hover:bg-bg-secondary'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[10px]">
                      <Dot color={option.color} className="block" />
                    </span>
                    {t(option.labelKey)}
                  </span>
                  <kbd className="hidden h-5 w-5 items-center justify-center rounded border border-current text-[10px] font-bold opacity-60 lg:inline-flex">
                    {option.shortcut}
                  </kbd>
                </button>
              );
            })}
          </div>
          {enrollment.status === 'INVITED' && (
            <div className="text-sm">
              <div className="mb-1 flex items-center gap-1 font-medium">
                {t('invitation_deadline')}
                <HelpIcon title={t('application_deadline_tooltip')} />
              </div>
              <div className="font-medium">{displayDate(enrollment.invitationExpirationDate)}</div>
            </div>
          )}
          <p className="hidden text-[11px] text-label-secondary lg:block">{t('application_details.keyboard_hint')}</p>
        </>
      )}
      {expandNext && (
        <button
          type="button"
          onClick={expandNext}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-label-primary text-sm font-bold lg:hidden"
        >
          {t(`application_details.${nextKey}`)}
          <MdArrowDownward />
        </button>
      )}
    </div>
  );

  const context = (
    <div
      className={`grid min-w-0 gap-6 px-4 pt-4 pb-2 md:grid-cols-2 md:px-6 [grid-area:context] ${
        hasAnswers
          ? `lg:grid-cols-1 lg:gap-5 lg:border-l lg:border-table-divider lg:bg-bg-secondary lg:px-5 lg:pb-5 ${
              sideHasRating ? 'lg:pt-0' : 'lg:pt-5'
            }`
          : 'lg:pb-5'
      }`}
    >
      {contact}
      {history}
    </div>
  );

  return (
    <div
      className={`grid w-full text-label-primary ${
        !hasAnswers
          ? "[grid-template-areas:'context'_'decision']"
          : sideHasRating
            ? "[grid-template-areas:'context'_'answers'_'decision'] lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_1fr] lg:[grid-template-areas:'answers_decision'_'answers_context'] xl:grid-cols-[minmax(0,1fr)_340px]"
            : "[grid-template-areas:'context'_'answers'_'decision'] lg:grid-cols-[minmax(0,1fr)_300px] lg:[grid-template-areas:'answers_context'] xl:grid-cols-[minmax(0,1fr)_340px]"
      }`}
    >
      {context}
      {answers}
      {decision}
    </div>
  );
};
