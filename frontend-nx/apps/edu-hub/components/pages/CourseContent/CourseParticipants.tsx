import { FC, useId, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';
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
  CourseParticipants_CourseParticipant_User,
} from '../../../queries/__generated__/CourseParticipants';

interface CourseParticipantsProps {
  courseId: number;
  /** Left out of the list: this is who else is here, not a roll call. */
  currentUserId?: string | null;
}

const AVATAR_PX = 48;
const STACK_AVATAR_PX = 36;
/** How many faces the collapsed summary shows before the "+N" bubble. */
const STACK_SIZE = 6;

/**
 * How filled-in a profile is, so the people easiest to recognize and reach
 * lead the list. The photo dominates the score: it is what actually makes
 * someone recognizable in the grid, well above a handle or profile link.
 */
const profileCompletenessScore = (user: CourseParticipants_CourseParticipant_User | null): number =>
  (user?.picture ? 4 : 0) + (user?.matrixUserHandle ? 2 : 0) + (user?.externalProfile ? 1 : 0);

const fullName = (user: CourseParticipants_CourseParticipant_User | null) =>
  `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

const Participant: FC<{ participant: CourseParticipants_CourseParticipant }> = ({ participant }) => {
  const t = useTranslations('course');
  const user = participant.User;

  const elementUrl = useMemo(() => elementDirectMessageUrl(user?.matrixUserHandle), [user?.matrixUserHandle]);

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
        <span className="text-sm font-semibold truncate">{fullName(user)}</span>
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
 * Collapsed, it is a stack of overlapping faces with the head count, the way
 * event platforms show who is going; expanded, the full directory. Guests,
 * who signed up without an account, are listed like everyone else.
 *
 * Rendered only for someone who is taking part themselves - the Hasura
 * permission on CourseParticipant enforces the same thing, so a non-participant
 * gets an empty list rather than a forbidden one, but there is no reason to ask
 * in the first place. People who have a Matrix handle can be messaged directly
 * in Element; everyone shares the course room anyway.
 */
export const CourseParticipants: FC<CourseParticipantsProps> = ({ courseId, currentUserId }) => {
  const t = useTranslations('course');
  const listId = useId();
  const [expanded, setExpanded] = useState(false);

  const { data } = useRoleQuery<CourseParticipantsData, CourseParticipantsVariables>(COURSE_PARTICIPANTS, {
    variables: { courseId },
  });

  const participants = useMemo(() => {
    const others = (data?.CourseParticipant ?? []).filter((p) => p.User && p.userId !== currentUserId);
    return [...others].sort(
      (a, b) => profileCompletenessScore(b.User) - profileCompletenessScore(a.User)
    );
  }, [data?.CourseParticipant, currentUserId]);

  // The total counts everyone; the list shows everyone but the viewer, so the
  // "and N more" is measured against what is actually on screen.
  const total = data?.CourseParticipant_aggregate?.aggregate?.count ?? 0;
  const othersTotal = Math.max(0, total - (total > participants.length ? 1 : 0));
  const notShown = Math.max(0, othersTotal - participants.length);

  if (participants.length === 0) {
    return null;
  }

  const stacked = participants.slice(0, STACK_SIZE);
  const beyondStack = othersTotal - stacked.length;

  return (
    <div>
      <SectionTitle className="mb-6">{t('participants.title')}</SectionTitle>
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls={listId}
        className="group flex flex-wrap items-center gap-x-4 gap-y-2 text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <span className="flex items-center -space-x-2.5" aria-hidden="true">
          {stacked.map((participant) => (
            <span
              key={participant.userId}
              className="inline-block rounded-full ring-2 ring-bg-primary"
              title={fullName(participant.User)}
            >
              <UserAvatar
                picture={participant.User?.picture ?? null}
                imageResolution={64}
                imageSize={STACK_AVATAR_PX}
                alt=""
                ariaHidden
                className="rounded-full object-cover bg-bg-secondary"
              />
            </span>
          ))}
          {beyondStack > 0 && (
            <span
              className="inline-flex items-center justify-center rounded-full ring-2 ring-bg-primary bg-bg-secondary text-label-primary text-xs font-semibold px-2"
              style={{ minWidth: `${STACK_AVATAR_PX}px`, height: `${STACK_AVATAR_PX}px` }}
            >
              +{beyondStack}
            </span>
          )}
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-label-primary">
            {t('participants.count', { count: total })}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-label-secondary group-hover:text-brand transition-colors">
            {expanded ? t('participants.show_less') : t('participants.show_all')}
            {expanded ? <MdExpandLess aria-hidden="true" /> : <MdExpandMore aria-hidden="true" />}
          </span>
        </span>
      </button>
      {expanded && (
        <div id={listId} className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {participants.map((participant) => (
              <Participant key={participant.userId} participant={participant} />
            ))}
          </div>
          {notShown > 0 && (
            <p className="mt-4 text-sm text-label-secondary">{t('participants.and_more', { count: notShown })}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseParticipants;
