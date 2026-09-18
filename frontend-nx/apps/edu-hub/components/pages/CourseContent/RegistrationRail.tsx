import { FC, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MdCalendarMonth, MdCheck, MdIosShare } from 'react-icons/md';

import { Course_Course_by_pk } from '../../../queries/__generated__/Course';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../../queries/__generated__/CourseWithEnrollment';
import { useIsAdmin, useIsInstructor } from '../../../hooks/authentication';
import UserCard from '../../common/UserCard';
import { CourseFacts } from './CourseFacts';
import { Registration } from './Registration';
import { ParticipationExitOutcome } from './Registration/participationExit';
import { useCourseCalendarExport, useSessionAddressMap } from './sessionLocations';

interface RegistrationRailProps {
  course: Course_Course_by_pk;
  courseEnrollment?: CourseWithEnrollment_Course_by_pk_CourseEnrollments;
  /** Whether the viewer may see online meeting links in the calendar export. */
  isLoggedInParticipant: boolean;
  onRegistrationSuccess?: (info?: { waitlist: boolean }) => void;
  onParticipationExit?: (outcome: ParticipationExitOutcome) => void;
}

const Divider: FC = () => <div className="border-t border-border-primary my-6" />;

const railButtonClassName =
  'flex flex-1 items-center justify-center gap-2 px-4 py-2 min-h-11 touch-manipulation rounded-full ' +
  'border-2 border-border-primary hover:border-brand hover:text-brand text-sm font-semibold ' +
  'text-label-primary transition-colors';

/**
 * Everything a visitor needs in order to act on the course, in one object:
 * the facts, the call to action, the deadline, the guest route in, and the
 * whole-course actions (calendar export, share).
 *
 * These used to be four fragments scattered down the page, each centring
 * itself, and on a long agenda the call to action scrolled out of reach. The
 * caller makes this sticky on wide screens; stacked, it sits directly under the
 * tagline so the facts arrive before the agenda that details them.
 */
export const RegistrationRail: FC<RegistrationRailProps> = ({
  course,
  courseEnrollment,
  isLoggedInParticipant,
  onRegistrationSuccess,
  onParticipationExit,
}) => {
  const t = useTranslations('course');
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');

  const sessions = course.Sessions ?? [];
  const addressMap = useSessionAddressMap(sessions);
  const handleExportICal = useCourseCalendarExport({
    sessions,
    courseLocations: course.CourseLocations ?? [],
    addressMap,
    canSeeOnlineLink: isLoggedInParticipant || isAdmin || isInstructor,
    courseId: course.id,
    courseTitle: course.title ?? undefined,
  });

  /**
   * The native share sheet where there is one, the clipboard otherwise. Both
   * can be refused (a dismissed sheet rejects, clipboard access can be denied),
   * and neither is worth an error state - the URL is in the address bar either
   * way - so a refusal just leaves the button as it was.
   */
  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: course.title ?? '', url });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareState('copied');
      window.setTimeout(() => setShareState('idle'), 2000);
    } catch {
      /* nothing to recover: the address bar already shows the link */
    }
  }, [course.title]);

  const instructors = course.CourseInstructors ?? [];

  return (
    <aside className="w-full rounded-2xl bg-fill-primary text-label-primary light p-6">
      <CourseFacts course={course} />

      <Divider />

      <Registration
        course={course}
        courseEnrollment={courseEnrollment}
        onRegistrationSuccess={onRegistrationSuccess}
        onParticipationExit={onParticipationExit}
      />

      <Divider />
      <div className="flex gap-2">
        {handleExportICal && (
          <button type="button" onClick={handleExportICal} className={railButtonClassName}>
            <MdCalendarMonth aria-hidden="true" />
            {t('sessions.add_to_calendar_short')}
          </button>
        )}
        <button type="button" onClick={handleShare} className={railButtonClassName}>
          {shareState === 'copied' ? (
            <>
              <MdCheck aria-hidden="true" />
              {t('general.link_copied')}
            </>
          ) : (
            <>
              <MdIosShare aria-hidden="true" />
              {t('general.share')}
            </>
          )}
        </button>
      </div>

      {instructors.length > 0 && (
        <>
          <Divider />
          <div className="flex flex-col gap-4">
            {instructors.map((instructor) => (
              <UserCard
                className="flex items-center"
                key={`instructor-${instructor.id || instructor.User?.id}`}
                user={instructor.User}
                size="compact"
              />
            ))}
          </div>
        </>
      )}
    </aside>
  );
};

export default RegistrationRail;
