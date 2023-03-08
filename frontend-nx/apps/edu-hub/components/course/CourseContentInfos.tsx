import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import checkmark from '../../public/images/course/checkmark.svg';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

import { Course_Course_by_pk } from '../../queries/__generated__/Course';
import { useState } from 'react';
import { invert } from 'lodash';

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseContentInfos: FC<IProps> = ({ course }) => {
  const { t, lang } = useTranslation('course-page');
  const [showAllSessions, setShowAllSessions] = useState(false);
  const visibleSessions = showAllSessions
    ? course.Sessions
    : course.Sessions.slice(0, 4);

  return (
    <div className="flex flex-1 flex-col">
      {course.learningGoals.trim() !== '' && (
        <>
          <span className="text-3xl font-semibold mb-9">
            {t('youWillLearn')}
          </span>
          <ul className="list-disc">
            {course.learningGoals
              .split('\n')
              .filter((goal) => goal.trim() !== '')
              .map((goal, index) => (
                <li key={index} className="pl-6 mb-6">
                  <div className="flex align-items-start">
                    <img
                      src={checkmark}
                      alt="check mark"
                      className="mr-2 inline-block"
                    />
                    <div className="ml-2">
                      {goal.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </>
      )}
      {visibleSessions.length > 0 && (
        <>
          <span className="text-3xl font-semibold mt-24 mb-9">
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
    </div>
  );
};
