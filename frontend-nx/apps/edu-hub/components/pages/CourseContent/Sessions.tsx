import { FC, useMemo, useState, useEffect } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

import { Course_Course_by_pk_Sessions as Session } from '../../../graphql/__generated__/Course';
import UserCard from '../../common/UserCard';
import { useDisplayDate, useFormatTimeString } from '../../../helpers/dateTimeHelpers';
import { isLinkFormat } from '../../../helpers/util';
import { useIsAdmin, useIsInstructor } from '../../../hooks/authentication';

interface SessionsProps {
  sessions: Session[];
  isLoggedInParticipant: boolean;
}

export const Sessions: FC<SessionsProps> = ({ sessions, isLoggedInParticipant }) => {
  const { t, lang } = useTranslation('course-page');
  const [showAllSessions, setShowAllSessions] = useState(false);
  const displayDate = useDisplayDate();
  const formatTimeString = useFormatTimeString();
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();

  const initiallyShownSessions = 4;

  const visibleSessions = useMemo(() => {
    return showAllSessions ? sessions : sessions.slice(0, initiallyShownSessions);
  }, [showAllSessions, sessions, initiallyShownSessions]);

  // Debugging: Log sessions data
  useEffect(() => {
    console.log('Sessions data:', sessions);
  }, [sessions]);

  return (
    <>
      {visibleSessions.length > 0 && (
        <>
          <span className="text-3xl font-semibold mt-24">{t('course_sessions')}</span>
          <ul>
            {visibleSessions.map(({ startDateTime, endDateTime, title, SessionSpeakers, SessionAddresses }, index) => (
              <li key={index} className="flex mb-4">
                <div className="flex flex-wrap items-start flex-shrink-0 mb-2">
                  <div className="flex flex-col mr-6">
                    <span className="block text-sm sm:text-lg font-semibold">{displayDate(startDateTime)}</span>
                    <span className="text-sm">
                      {formatTimeString(startDateTime)}
                      {' - '}
                      {formatTimeString(endDateTime)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="block text-sm sm:text-lg whitespace-nowrap sm:whitespace-normal">{title}</span>
                  <div className="whitespace-nowrap ml-0 pl-0">
                    {SessionAddresses.map(({ address, CourseLocation }, addressIndex) => {
                      // Debugging: Log CourseLocation and address for each SessionAddress
                      console.log(`Session ${index}, Address ${addressIndex}, CourseLocation:`, CourseLocation, 'address:', address);

                      const displayAddress = address && address.trim() !== '' ? address : CourseLocation?.defaultSessionAddress;

                      return (
                        <span key={addressIndex} className="text-sm text-gray-400 ml-0 pl-0">
                          {CourseLocation ? (
                            CourseLocation.locationOption === 'ONLINE' ? (
                              <>
                                {isLoggedInParticipant || isAdmin || isInstructor ? (
                                  isLinkFormat(displayAddress) ? (
                                    <a
                                      href={displayAddress}
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
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  displayAddress
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                {displayAddress}
                              </a>
                            )
                          ) : (
                            'Location not available'
                          )}
                          {addressIndex < SessionAddresses.length - 1 && ' +\u00A0'}
                        </span>
                      );
                    })}
                  </div>
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
