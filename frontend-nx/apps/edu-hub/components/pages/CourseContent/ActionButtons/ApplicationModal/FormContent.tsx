import useTranslation from 'next-translate/useTranslation';
import { FC } from 'react';

import { Course_Course_by_pk } from '../../../../../graphql/__generated__/Course';
import { Button } from '../../../../common/Button';

interface IProps {
  applyForCourse: () => void;
  course: Course_Course_by_pk;
  setText: (event: any) => void;
  text: string;
}

export const CourseApplicationModalFormContent: FC<IProps> = ({ applyForCourse, course, setText, text }) => {
  const { t } = useTranslation('course-application');

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <span className="text-base mb-2">
        <p>{t('applicationFor')}</p>
      </span>
      <span className="text-3xl font-semibold">{course.title}</span>
      <span className="font-semibold mt-4 mb-4">
        <p>{t('introduction-motivation-letter-1')}</p>
        <p>{t('introduction-motivation-letter-2')}</p>
      </span>
      <textarea
        onChange={setText}
        className="md:h-24 h-96 mt-3 bg-gray-100 focus:border-none overflow-y-auto w-full"
        value={text}
        placeholder={t('course-application:placeholder-motivation-letter')}
      />
      <div className="flex justify-center my-6">
        <Button filled onClick={applyForCourse}>
          {t('sendApplication')}
        </Button>
      </div>
    </div>
  );
};
