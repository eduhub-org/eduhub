import { useQuery } from '@apollo/client';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { useTranslations } from 'next-intl';

import { Page } from '../../components/layout/Page';
import UserCard from '../../components/common/UserCard';
import { PUBLIC_EVENT_BY_ID } from '../../queries/publicEvents';
import {
  PublicEventById,
  PublicEventByIdVariables,
} from '../../queries/__generated__/PublicEventById';
import { AuthRoles } from '../../types/enums';
import {
  useDisplayDate,
  useFormatTimeString,
} from '../../helpers/dateTimeHelpers';
import { getBackgroundImage } from '../../helpers/imageHandling';
import { isLinkFormat } from '../../helpers/util';

const PublicEventPage: FC = () => {
  const router = useRouter();
  const t = useTranslations('event');
  const tCourse = useTranslations('course');
  const tCommon = useTranslations('common');
  const displayDate = useDisplayDate();
  const formatTimeString = useFormatTimeString();

  const sessionIdRaw = router.query.sessionId;
  const sessionId =
    typeof sessionIdRaw === 'string' ? parseInt(sessionIdRaw, 10) : NaN;

  const { data, loading, error } = useQuery<PublicEventById, PublicEventByIdVariables>(
    PUBLIC_EVENT_BY_ID,
    {
      variables: { sessionId },
      context: { role: AuthRoles.anonymous },
      skip: !Number.isFinite(sessionId),
    }
  );

  const event = data?.Session_by_pk;
  const course = event?.Course;

  const [backgroundImage, setBackgroundImage] = useState<string>('');
  useEffect(() => {
    const loadCover = async () => {
      const img = await getBackgroundImage(course?.coverImage ?? null);
      setBackgroundImage(img);
    };
    loadCover();
  }, [course?.coverImage]);

  if (loading) {
    return (
      <Page>
        <div className="flex justify-center max-w-screen-xl mx-auto w-full pt-32">
          <CircularProgress />
        </div>
      </Page>
    );
  }

  // Show "not available" if there's no event, the flag isn't set, or there's
  // an error. We intentionally do not differentiate further — an unpromoted
  // session must not be reachable via this URL.
  if (error || !event || !event.isPublicEvent || !course) {
    return (
      <Page>
        <div className="flex justify-center max-w-screen-xl mx-auto w-full pt-32">
          <div className="text-white">{t('not_available')}</div>
        </div>
      </Page>
    );
  }

  const pageTitle = `${event.title || course.title} | EduHub`;
  const description = event.description || course.tagline || '';
  const seoImage = course.coverImage
    ? `https://edu.opencampus.sh/images/${course.coverImage}`
    : 'https://edu.opencampus.sh/images/edu_WISE23_HeaderWebsitePreview.png';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="icon" href="/favicon.png" />

        <meta property="og:type" content="event" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={seoImage} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={seoImage} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Event',
              name: event.title || course.title,
              description,
              startDate: event.startDateTime,
              endDate: event.endDateTime,
              eventStatus: 'https://schema.org/EventScheduled',
              organizer: {
                '@type': 'Organization',
                name: 'opencampus.sh',
                url: 'https://edu.opencampus.sh',
              },
            }),
          }}
        />
      </Head>
      <Page>
        <div className="flex flex-col space-y-8 lg:space-y-16">
          <div
            className="h-96 p-3 text-3xl text-white flex justify-start items-end bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(51.32deg, rgba(0, 0, 0, 0.7) 17.57%, rgba(0, 0, 0, 0) 85.36%), url("${backgroundImage}")`,
            }}
          >
            <div className="max-w-screen-xl mx-auto w-full">
              {event.title || course.title}
            </div>
          </div>

          <div className="max-w-screen-xl mx-auto w-full text-white px-4 lg:px-0 pb-24">
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">{t('when')}</h2>
              <p className="text-lg">
                <span className="font-semibold">{displayDate(event.startDateTime)}</span>
                {', '}
                {formatTimeString(event.startDateTime)} – {formatTimeString(event.endDateTime)}
              </p>
            </section>

            {event.SessionAddresses && event.SessionAddresses.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">{t('where')}</h2>
                <ul className="space-y-2">
                  {event.SessionAddresses.map((sa) => {
                    const locationOption = sa.CourseLocation?.locationOption;
                    const addrText =
                      sa.LocationAddress?.address ||
                      sa.address ||
                      sa.CourseLocation?.defaultSessionAddress ||
                      '';
                    if (locationOption === 'ONLINE') {
                      return (
                        <li key={sa.id} className="text-lg">
                          <span className="font-semibold">{tCommon('location.ONLINE')}</span>
                          {addrText && isLinkFormat(addrText) ? (
                            <>
                              {' — '}
                              <a
                                href={addrText}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                {t('online_link')}
                              </a>
                            </>
                          ) : addrText ? (
                            <span className="text-label-secondary ml-2">{addrText}</span>
                          ) : null}
                        </li>
                      );
                    }
                    return (
                      <li key={sa.id} className="text-lg">
                        {locationOption && (
                          <span className="font-semibold mr-2">
                            {tCommon(`location.${locationOption}`)}
                          </span>
                        )}
                        {addrText && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addrText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {addrText}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {event.description && (
              <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">{t('description')}</h2>
                <p className="text-lg whitespace-pre-wrap">{event.description}</p>
              </section>
            )}

            {event.SessionSpeakers && event.SessionSpeakers.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">{t('speakers')}</h2>
                <div className="flex flex-col gap-3">
                  {event.SessionSpeakers.map((sp) => (
                    <UserCard
                      key={sp.id}
                      className="flex items-center"
                      user={sp.User}
                      role={tCourse('general.speaker')}
                      size="medium"
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="mb-12 border-t border-border-primary pt-8">
              <h2 className="text-2xl font-semibold mb-4">{t('part_of_course')}</h2>
              <Link
                href={`/course/${course.id}`}
                className="text-lg underline hover:no-underline"
              >
                {course.title}
              </Link>
              {course.Program?.title && (
                <p className="text-sm text-label-secondary mt-1">{course.Program.title}</p>
              )}
            </section>
          </div>
        </div>
      </Page>
    </>
  );
};

export default PublicEventPage;
