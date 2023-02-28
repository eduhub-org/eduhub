import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { Course_Course_by_pk } from '../../queries/__generated__/Course';

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseDescriptionInfos: FC<IProps> = ({ course }) => {
  // const { t, lang } = useTranslation('course-page');

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap mt-20 bg-edu-course-invited rounded-2xl p-4">
        <div className="w-full md:w-1/2 p-6">
          <h2 className="text-3xl font-semibold mb-6">
            {course.headingDescriptionField1}
          </h2>
          <p>{course.contentDescriptionField1}</p>
        </div>
        <div className="w-full md:w-1/2 p-6">
          <h2 className="text-3xl font-semibold mb-6">
            {course.headingDescriptionField2}
          </h2>
          <p>{course.contentDescriptionField2}</p>
        </div>
      </div>
    </div>
  );
};
