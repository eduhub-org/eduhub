import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import ReactMarkdown from 'react-markdown';

import { Course_Course_by_pk } from '../../queries/__generated__/Course';

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseDescriptionInfos: FC<IProps> = ({ course }) => {
  // const { t, lang } = useTranslation('course-page');
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-wrap mt-20 bg-edu-course-invited rounded-2xl p-4">
        <div className="w-full md:w-1/2 p-6">
          <h2 className="text-3xl font-semibold mb-6">
            {course.headingDescriptionField1}
          </h2>
          <ReactMarkdown>{course.contentDescriptionField1}</ReactMarkdown>
        </div>
        <div className="w-full md:w-1/2 p-6">
          <h2 className="text-3xl font-semibold mb-6">
            {course.headingDescriptionField2}
          </h2>
          <ReactMarkdown>{course.contentDescriptionField2}</ReactMarkdown>
        </div>
      </div>
      <div className="flex flex-wrap mt-10 bg-white rounded-2xl p-4">
        <ReactMarkdown>{t('course-page:general-course-info')}</ReactMarkdown>
      </div>
    </>
  );
};
