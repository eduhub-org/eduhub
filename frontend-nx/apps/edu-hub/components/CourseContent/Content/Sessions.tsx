import { FC, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

import { Course_Course_by_pk_Sessions as Session } from '../../../queries/__generated__/Course';

interface SessionsProps {
  sessions: Session[];
}

export const Sessions: FC<SessionsProps> = ({ sessions }) => {
  const { t, lang } = useTranslation('course-page');
  const [showAllSessions, setShowAllSessions] = useState(false);
  const visibleSessions = showAllSessions
    ? sessions
    : sessions.slice(0, 4);

  return (
    <>
      {visibleSessions.length > 0 && (
        <>
          <span className="text-3xl font-semibold mt-24">
            {t('courseContent')}
          </span>
          <ul>
            {visibleSessions.map(
              ({ startDateTime, title, SessionAddresses }, index) => (
                <li key={index} className="flex mb-4">
                  <div className="flex flex-col flex-shrink-0 mr-6">
                    <span className="text-xs sm:text-sm font-semibold">
                      {startDateTime?.toLocaleDateString(lang, {
                        month: '2-digit',
                        day: '2-digit',
                      }) ?? ''}
                    </span>
                    <span className="text-xs sm:text-sm">
                      {startDateTime?.toLocaleTimeString(lang, {
                        hour: 'numeric',
                        minute: 'numeric',
                      }) ?? ''}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm sm:text-lg">{title}</span>
                    {SessionAddresses.map(({ address, type }, index) => (
                      <span key={index} className="text-sm text-gray-400">
                        {type === 'URL' ? (
                          <a
                            href={address}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            ONLINE
                          </a>
                        ) : (
                          <>
                            {address}
                            {index !== SessionAddresses.length - 1 && ' + '}
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                </li>
              )
            )}
          </ul>
          {showAllSessions ? (
            <button
              className="text-white hover:underline italic text-sm flex items-center"
              onClick={() => setShowAllSessions(false)}
            >
              {t('course-page:hide-sessions')}
              <IoIosArrowUp className="ml-1" />
            </button>
          ) : (
            <button
              className="text-white hover:underline italic text-sm flex items-center"
              onClick={() => setShowAllSessions(true)}
            >
              {t('course-page:show-all-sessions')}
              <IoIosArrowDown className="ml-1" />
            </button>
          )}
        </>
      )}
    </>
  );
};
