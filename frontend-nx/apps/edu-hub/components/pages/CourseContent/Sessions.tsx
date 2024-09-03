import { FC, useMemo, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

import { Course_Course_by_pk_Sessions as Session } from '../../../queries/__generated__/Course';
import UserCard from '../../common/UserCard';

interface SessionsProps {
  sessions: Session[];
  isLoggedInParticipant: boolean;
}

export const Sessions: FC<SessionsProps> = ({ sessions }) => {
  const { t, lang } = useTranslation('course-page');
  const [showAllSessions, setShowAllSessions] = useState(false);

  const initiallyShownSessions = 4;

  const visibleSessions = useMemo(() => {
    return showAllSessions ? sessions : sessions.slice(0, initiallyShownSessions);
  }, [showAllSessions, sessions, initiallyShownSessions]);

  return (
    <>
      {visibleSessions.length > 0 && (
        <>
          <span className="text-3xl font-semibold mt-24">{t('course_sessions')}</span>
          <ul>
            {visibleSessions.map(({ startDateTime, endDateTime, title, SessionSpeakers }, index) => (
              <li key={index} className="flex mb-4">
                <div className="flex flex-wrap items-start flex-shrink-0 mb-2">
                  <div className="flex flex-col mr-6">
                    <span className="block text-sm sm:text-lg font-semibold">
                      {startDateTime?.toLocaleDateString(lang, {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      }) ?? ''}
                    </span>
                    <span className="text-sm">
                      {startDateTime?.toLocaleTimeString(lang, {
                        hour: 'numeric',
                        minute: 'numeric',
                      }) ?? ''}{' '}
                      {' - '}
                      {endDateTime?.toLocaleTimeString(lang, {
                        hour: 'numeric',
                        minute: 'numeric',
                      }) ?? ''}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="block text-sm sm:text-lg whitespace-nowrap sm:whitespace-normal">{title}</span>
                  {/* <div className="whitespace-nowrap ml-0 pl-0">
                    {SessionAddresses.map(({ address, CourseLocation }, index) => (
                      <span key={index} className="text-sm text-gray-400 ml-0 pl-0">
                        {CourseLocation.locationOption === 'ONLINE' ? (
                          <>
                            {isLoggedInParticipant || isAdmin || isInstructor ? (
                              // if the user is a logged in participant, an instructor or an admin, provide the link to the video call otherwise display the location as plain text
                              isLinkFormat(CourseLocation.defaultSessionAddress) ? (
                                <a
                                  href={CourseLocation.defaultSessionAddress}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline"
                                >
                                  ONLINE
                                </a>
                              ) : (
                                t('link_will_be_provided_soon')
                              )
                            ) : (
                              'ONLINE'
                            )}
                          </>
                        ) : (
                          // If the user is not logged in, display the location or address as plain text
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              CourseLocation.defaultSessionAddress
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {CourseLocation.defaultSessionAddress}
                          </a>
                        )}
                        {index < SessionAddresses.length - 1 && ' +\u00A0'}
                      </span>
                    ))}
                  </div> */}
                  <div className="flex flex-col">
                    {SessionSpeakers &&
                      SessionSpeakers.map((speaker, speakerIndex) => (
                        <UserCard
                          key={speakerIndex}
                          className="flex items-center my-3"
                          user={speaker.Expert.User}
                          role={t('speaker')}
                          size="medium"
                        />
                      ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {sessions.length > initiallyShownSessions &&
            (showAllSessions ? (
              <button
                className="text-white text-sm sm:text-lg font-semibold hover:underline italic flex items-center pb-6"
                onClick={() => setShowAllSessions(false)}
              >
                {t('hideSessions')}
                <IoIosArrowUp className="ml-1" />
              </button>
            ) : (
              <button
                className="text-white text-sm sm:text-lg font-semibold hover:underline italic flex items-center pb-6"
                onClick={() => setShowAllSessions(true)}
              >
                {t('showAllSessions')}
                <IoIosArrowDown className="ml-1" />
              </button>
            ))}
        </>
      )}
    </>
  );
};
