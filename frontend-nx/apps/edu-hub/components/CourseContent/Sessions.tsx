  import { FC, useState } from 'react';
  import useTranslation from 'next-translate/useTranslation';
  import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

  import { Course_Course_by_pk_Sessions as Session } from '../../queries/__generated__/Course';
  import { isLinkFormat } from '../../helpers/util';

  interface SessionsProps {
    sessions: Session[];
  }

  export const Sessions: FC<SessionsProps> = ({ sessions }) => {
    const { t, lang } = useTranslation('course-page');
    const [showAllSessions, setShowAllSessions] = useState(false);
    const visibleSessions = showAllSessions ? sessions : sessions.slice(0, 4);

    return (
      <>
        {visibleSessions.length > 0 && (
          <>
            <span className="text-3xl font-semibold mt-24">
              {t('courseContent')}
            </span>
            <ul>
              {visibleSessions.map(
                ({ startDateTime, endDateTime, title, SessionAddresses }, index) => (
                  <li key={index} className="flex mb-4">
                    <div className="flex flex-col flex-shrink-0 mr-6">
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
                    <div className="flex flex-col">
                      <span className="block text-sm sm:text-lg">{title}</span>
                      <div className="flex items-center ml-0 pl-0">
                        {SessionAddresses.map(({ address }, index) => (
                          <span
                            key={index}
                            className="text-sm text-gray-400 ml-0 pl-0"
                          >
                            {isLinkFormat(address) ? (
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
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    address
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline"
                                >
                                  {address}
                                </a>
                              </>
                            )}
                            {index < SessionAddresses.length - 1 && ' +\u00A0'}
                          </span>
                        ))}
                      </div>
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
