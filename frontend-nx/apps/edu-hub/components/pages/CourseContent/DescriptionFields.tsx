import { FC } from 'react';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Course_Course_by_pk } from '../../../queries/__generated__/Course';

interface IProps {
  course: Course_Course_by_pk;
}

export const DescriptionFields: FC<IProps> = ({ course }) => {
  const t = useTranslations('course');

  // Events do not award achievement certificates, so the attendance rules -
  // camera on, and so forth - have nothing to apply to.
  const isEventCourse = course.Program?.type === 'EVENTS';
  const isAchievementCertificatePossible = !isEventCourse && course.achievementCertificatePossible;

  return (
    <>
      {(course.headingDescriptionField1 && course.contentDescriptionField1) ||
      (course.headingDescriptionField2 && course.contentDescriptionField2) ? (
        /* bg-edu-course-invited was --eduhub-status-invited, the "you are
           invited" enrollment state. It carried no meaning here and made the
           least important block on the page the loudest. */
        <div className="flex flex-wrap bg-bg-card border border-border-primary text-label-primary rounded-2xl p-2 sm:p-4 mx-6 xl:mx-0">
          {course.headingDescriptionField1 || course.contentDescriptionField1 ? (
            <div
              className={`w-full md:w-1/2 p-6 min-w-0 ${
                !course.headingDescriptionField2 && !course.contentDescriptionField2 ? 'md:w-full' : ''
              }`}
            >
              <h2 className="text-2xl font-semibold mb-4 text-label-primary break-words">{course.headingDescriptionField1}</h2>
              <ReactMarkdown className="prose prose-invert max-w-none break-words [&_*]:break-words" remarkPlugins={[remarkGfm]}>
                {course.contentDescriptionField1}
              </ReactMarkdown>
            </div>
          ) : null}
          {course.headingDescriptionField2 || course.contentDescriptionField2 ? (
            <div
              className={`w-full md:w-1/2 p-6 min-w-0 ${
                !course.headingDescriptionField1 && !course.contentDescriptionField1 ? 'md:w-full' : ''
              }`}
            >
              <h2 className="text-2xl font-semibold mb-4 text-label-primary break-words">{course.headingDescriptionField2}</h2>
              <ReactMarkdown className="prose prose-invert max-w-none break-words [&_*]:break-words" remarkPlugins={[remarkGfm]}>
                {course.contentDescriptionField2}
              </ReactMarkdown>
            </div>
          ) : null}
        </div>
      ) : null}
      {isAchievementCertificatePossible ? (
        <div className="flex flex-wrap bg-transparent text-label-primary rounded-2xl p-2 sm:p-4 mx-6 xl:mx-0">
          <ReactMarkdown
            className="prose max-w-none break-words [&_*]:break-words text-label-primary prose-headings:font-semibold prose-headings:text-label-primary prose-p:text-label-primary prose-strong:text-label-primary prose-li:text-label-primary"
            remarkPlugins={[remarkGfm]}
          >
            {t('learning.general_achievement_certificate_conditions').replace(/\n/g, '  \n')}
          </ReactMarkdown>
        </div>
      ) : null}
    </>
  );
};
