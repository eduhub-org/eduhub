import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SiElement } from 'react-icons/si';

import { SectionTitle } from '../../common/SectionTitle';
import UserAvatar from '../../common/UserAvatar';
import { elementDirectMessageUrl } from '../../../helpers/matrix';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { COURSE_PARTICIPANTS } from '../../../queries/courseParticipant';
import {
  CourseParticipants as CourseParticipantsData,
  CourseParticipantsVariables,
  CourseParticipants_CourseParticipant,
} from '../../../queries/__generated__/CourseParticipants';

interface CourseParticipantsProps {
  courseId: number;
  /** Left out of the list: this is who else is here, not a roll call. */
  currentUserId?: string | null;
}

const AVATAR_PX = 48;

const Participant: FC<{ participant: CourseParticipants_CourseParticipant }> = ({ participant }) => {
  const t = useTranslations('course');
  const user = participant.User;

  const elementUrl = useMemo(() => elementDirectMessageUrl(user?.matrixUserHandle), [user?.matrixUserHandle]);

  const displayName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  return (
    <div className="flex items-center gap-3 min-w-0">
      <UserAvatar
        picture={user?.picture ?? null}
        imageResolution={64}
        imageSize={AVATAR_PX}
        alt=""
        ariaHidden
        className="rounded-full object-cover flex-shrink-0"
      />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold truncate">{displayName}</span>
        {elementUrl ? (
          <a
            href={elementUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-label-secondary hover:text-brand transition-colors min-h-[24px]"
          >
            <SiElement aria-hidden="true" />
            {t('participants.message_on_element')}
          </a>
        ) : null}
      </div>
    </div>
  );
};

/**
 * Who else is taking part in this course.
 *
 * Rendered only for someone who is taking part themselves - the Hasura
 * permission on CourseParticipant enforces the same thing, so a non-participant
 * gets an empty list rather than a forbidden one, but there is no reason to ask
 * in the first place. People who have a Matrix handle can be messaged directly
 * in Element; everyone shares the course room anyway.
 */
export const CourseParticipants: FC<CourseParticipantsProps> = ({ courseId, currentUserId }) => {
  const t = useTranslations('course');

  const { data } = useRoleQuery<CourseParticipantsData, CourseParticipantsVariables>(COURSE_PARTICIPANTS, {
    variables: { courseId },
  });

  const participants = useMemo(
    () => (data?.CourseParticipant ?? []).filter((p) => p.User && p.userId !== currentUserId),
    [data?.CourseParticipant, currentUserId]
  );

  // The total counts everyone; the list shows everyone but the viewer, so the
  // "and N more" is measured against what is actually on screen.
  const total = data?.CourseParticipant_aggregate?.aggregate?.count ?? 0;
  const othersTotal = Math.max(0, total - (total > participants.length ? 1 : 0));
  const notShown = Math.max(0, othersTotal - participants.length);

  if (participants.length === 0) {
    return null;
  }

  return (
    <div>
      <SectionTitle className="mb-8">{t('participants.title')}</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {participants.map((participant) => (
          <Participant key={participant.userId} participant={participant} />
        ))}
      </div>
      {notShown > 0 && (
        <p className="mt-4 text-sm text-label-secondary">{t('participants.and_more', { count: notShown })}</p>
      )}
    </div>
  );
};

export default CourseParticipants;
