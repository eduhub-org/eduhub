import Link from 'next/link';
import { FC } from 'react';
import { useTranslations } from 'next-intl';

import { TileBase } from '../TileSlider/TileBase';
import { useDisplayDate, useFormatTimeString } from '../../../helpers/dateTimeHelpers';

// Structural type. EventTile is intentionally not tied to a specific generated
// query type so it can be reused for the public events slider, the homepage
// follow-up issue (program-type-driven slider groups), or any other consumer
// that has a Session + its parent Course available.
export interface EventTileSession {
  id: number;
  title: string;
  startDateTime: string | Date;
  endDateTime: string | Date;
  Course: {
    id: number;
    title: string;
    coverImage: string | null;
  };
}

interface EventTileProps {
  session: EventTileSession;
}

export const EventTile: FC<EventTileProps> = ({ session }) => {
  const t = useTranslations('common');
  const displayDate = useDisplayDate();
  const formatTimeString = useFormatTimeString();

  const sessionTitle = session.title || session.Course.title;

  return (
    <Link href={`/event/${session.id}`}>
      <TileBase
        coverImage={session.Course.coverImage ?? null}
        title={sessionTitle}
        bannerText={t('event_tile.badge')}
      >
        <div className="flex flex-col mb-3 text-sm tracking-wider text-label-primary">
          <span className="font-semibold">{displayDate(session.startDateTime)}</span>
          <span className="text-label-secondary">
            {formatTimeString(session.startDateTime)} – {formatTimeString(session.endDateTime)}
          </span>
        </div>
        <span className="text-lg mb-auto line-clamp-3 text-label-primary">
          {session.Course.title}
        </span>
        <div className="flex justify-end text-xs tracking-wider text-label-secondary">
          {t('event_tile.see_details')}
        </div>
      </TileBase>
    </Link>
  );
};

export default EventTile;
