import { FC, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

import { Course_Course_by_pk_Sessions as Session } from '../../../queries/__generated__/Course';
import { isLinkFormat } from '../../../helpers/util';
import UserCard from '../../common/UserCard';
import { useIsAdmin, useIsInstructor } from '../../../hooks/authentication';

interface SessionsProps {
  sessions: Session[];
  isLoggedInParticipant: boolean;
}

export const Sessions: FC<SessionsProps> = ({ sessions, isLoggedInParticipant }) => {
  const { t, lang } = useTranslation('course');
  const [showAllSessions, setShowAllSessions] = useState(false);

  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();

  const initiallyShownSessions = 4;

  const visibleSessions = showAllSessions ? sessions : sessions.slice(0, initiallyShownSessions);

  return (
    <>
      {visibleSessions.length > 0 && (
        <>
          <span className="text-3xl font-semibold mt-24">{t('courseSessions')}</span>
          <ul>
            {visibleSessions.map(({ startDateTime, endDateTime, title, SessionAddresses, SessionSpeakers }, index) => (
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
                  <div className="whitespace-nowrap ml-0 pl-0">
                    {SessionAddresses.map(({ address }, index) => (
                      <span key={index} className="text-sm text-gray-400 ml-0 pl-0">
                        {isLoggedInParticipant || isAdmin || isInstructor ? (
                          isLinkFormat(address) ? (
                            <a href={address} target="_blank" rel="noopener noreferrer" className="underline">
                              ONLINE
                            </a>
                          ) : (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              {address}
                            </a>
                          )
                        ) : // If the user is not logged in, display the address as plain text
                        isLinkFormat(address) ? (
                          'ONLINE'
                        ) : (
                          address
                        )}
                        {index < SessionAddresses.length - 1 && ' +\u00A0'}
                      </span>
                    ))}
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
