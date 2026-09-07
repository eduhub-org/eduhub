import { FC, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CircularProgress } from '@mui/material';
import ReactMarkdown from 'react-markdown';

import { useRoleQuery } from '../../../hooks/authedQuery';
import { AuthRoles } from '../../../types/enums';
import { PUBLIC_EVENT_BY_ID } from '../../../queries/publicEvents';
import {
  PublicEventById,
  PublicEventByIdVariables,
} from '../../../queries/__generated__/PublicEventById';
import { useDisplayDate, useFormatTimeString } from '../../../helpers/dateTimeHelpers';
import { getBackgroundImage } from '../../../helpers/imageHandling';
import { isLinkFormat } from '../../../helpers/util';
import UserCard from '../../common/UserCard';
import { PageBlock } from '../../common/PageBlock';
import { LOCATION_ADDRESSES_BY_IDS } from '../../../queries/locationAddress';

const EventContent: FC<{ sessionId: number }> = ({ sessionId }) => {
  const t = useTranslations('event');
  const tCourse = useTranslations('course');
  const displayDate = useDisplayDate();
  const formatTimeString = useFormatTimeString();
  const [backgroundImage, setBackgroundImage] = useState('');

  const { data, loading } = useRoleQuery<PublicEventById, PublicEventByIdVariables>(PUBLIC_EVENT_BY_ID, {
    variables: { sessionId },
    context: { role: AuthRoles.anonymous },
    fetchPolicy: 'cache-and-network',
  });

  const session = data?.Session?.[0];
  const course = session?.Course;

  useEffect(() => {
    const loadImage = async () => {
      const image = await getBackgroundImage(course?.coverImage ?? null);
      setBackgroundImage(image);
    };
    void loadImage();
  }, [course?.coverImage]);

  const addressIds = useMemo(() => {
    const ids = new Set<number>();
    session?.SessionAddresses.forEach((sessionAddress) => {
      const locationAddressId = sessionAddress.locationAddressId;
      const defaultSessionAddressId = sessionAddress.CourseLocation?.defaultSessionAddressId;
      if (locationAddressId) ids.add(locationAddressId);
      if (defaultSessionAddressId) ids.add(defaultSessionAddressId);
    });
    return Array.from(ids);
  }, [session?.SessionAddresses]);

  const { data: addressData } = useRoleQuery(LOCATION_ADDRESSES_BY_IDS, {
    variables: { ids: addressIds },
    skip: addressIds.length === 0,
    context: { role: AuthRoles.anonymous },
  });

  const addressMap = useMemo(() => {
    const map = new Map<number, { address: string }>();
    addressData?.LocationAddress?.forEach((addr: { id: number; address: string }) => {
      map.set(addr.id, addr);
    });
    return map;
  }, [addressData]);

  if (loading && !session) {
    return (
      <div className="flex justify-center max-w-screen-xl mx-auto w-full pt-32">
        <CircularProgress />
      </div>
    );
  }

  if (!session || !course) {
    return (
      <div className="flex justify-center max-w-screen-xl mx-auto w-full pt-32">
        <div className="text-white">{t('EventContent.not_found')}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-12 lg:space-y-24">
      <div
        className="h-96 p-3 text-3xl text-white flex justify-start items-end bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(51.32deg, rgba(0, 0, 0, 0.7) 17.57%, rgba(0, 0, 0, 0) 85.36%), url("${backgroundImage}")`,
        }}
      >
        <div className="max-w-screen-xl mx-auto w-full">
          <p className="text-sm mb-2 opacity-90">{course.title}</p>
          <h1>{session.title}</h1>
        </div>
      </div>

      <PageBlock>
        <div className="max-w-screen-xl mx-auto w-full text-white space-y-10">
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('EventContent.date_time_heading')}</h2>
            <p className="text-lg">
              {displayDate(session.startDateTime)}
              {', '}
              {formatTimeString(session.startDateTime)}
              {' – '}
              {formatTimeString(session.endDateTime)}
            </p>
          </section>

          {session.description ? (
            <section>
              <h2 className="text-2xl font-semibold mb-3">{t('EventContent.description_heading')}</h2>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{session.description}</ReactMarkdown>
              </div>
            </section>
          ) : null}

          {session.SessionSpeakers.length > 0 ? (
            <section>
              <h2 className="text-2xl font-semibold mb-3">{t('EventContent.speakers_heading')}</h2>
              <div className="space-y-2">
                {session.SessionSpeakers.map((speaker) => (
                  <UserCard
                    key={speaker.id}
                    className="flex items-center"
                    user={speaker.User}
                    role={tCourse('general.speaker')}
                    size="medium"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {session.SessionAddresses.length > 0 ? (
            <section>
              <h2 className="text-2xl font-semibold mb-3">{t('EventContent.location_heading')}</h2>
              <ul className="space-y-2 text-label-secondary">
                {session.SessionAddresses.map((sessionAddress) => {
                  const { address, CourseLocation } = sessionAddress;
                  const locationAddressId = sessionAddress.locationAddressId;
                  const defaultSessionAddressId = CourseLocation?.defaultSessionAddressId;
                  const effectiveAddressId = locationAddressId || defaultSessionAddressId;
                  let displayAddress = '';
                  if (effectiveAddressId && addressMap.has(effectiveAddressId)) {
                    displayAddress = addressMap.get(effectiveAddressId)?.address ?? '';
                  } else {
                    displayAddress =
                      address && address.trim() !== ''
                        ? address
                        : CourseLocation?.defaultSessionAddress || '';
                  }

                  return (
                    <li key={sessionAddress.id}>
                      {CourseLocation?.locationOption === 'ONLINE' ? (
                        isLinkFormat(displayAddress) ? (
                          <a
                            href={displayAddress}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-brand"
                          >
                            ONLINE
                          </a>
                        ) : (
                          'ONLINE'
                        )
                      ) : displayAddress ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-brand"
                        >
                          {displayAddress}
                        </a>
                      ) : (
                        CourseLocation?.locationOption
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('EventContent.course_heading')}</h2>
            <p className="mb-4 text-label-secondary">{course.tagline}</p>
            <Link href={`/course/${course.id}`} className="text-brand underline font-medium">
              {t('EventContent.view_course_link')}
            </Link>
          </section>
        </div>
      </PageBlock>
    </div>
  );
};

export default EventContent;
