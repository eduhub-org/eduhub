import Link from 'next/link';
import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { PublicEvents_Session } from '../../../queries/__generated__/PublicEvents';
import { PublicEventById_Session } from '../../../queries/__generated__/PublicEventById';
import { useDisplayDate, useFormatTimeString } from '../../../helpers/dateTimeHelpers';
import { TileBase } from './TileBase';

export type PublicEventSession = PublicEvents_Session | PublicEventById_Session;

interface EventTileProps {
  session: PublicEventSession;
}

export const EventTile: FC<EventTileProps> = ({ session }) => {
  const t = useTranslations('event');
  const displayDate = useDisplayDate();
  const formatTimeString = useFormatTimeString();
  const course = session.Course;

  return (
    <Link href={`/event/${session.id}`}>
      <TileBase coverImage={course?.coverImage ?? null} title={session.title}>
        <div className="text-sm tracking-wider text-label-secondary mb-2">
          {displayDate(session.startDateTime)}
          {' · '}
          {formatTimeString(session.startDateTime)}
          {' – '}
          {formatTimeString(session.endDateTime)}
        </div>
        <span className="text-lg mb-auto line-clamp-2 text-label-primary">{course?.title}</span>
        <div className="text-xs tracking-wider text-label-secondary mt-3">
          {course?.CourseLocations?.map((location, index) => (
            <span key={location.id}>
              {location.locationOption}
              {index < (course.CourseLocations?.length ?? 0) - 1 ? ' + ' : ''}
            </span>
          ))}
        </div>
        <span className="sr-only">{t('EventTile.view_event')}</span>
      </TileBase>
    </Link>
  );
};
