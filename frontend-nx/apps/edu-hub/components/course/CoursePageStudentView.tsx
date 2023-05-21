import useTranslation from 'next-translate/useTranslation';
import { FC } from 'react';

import { CourseWithEnrollment_Course_by_pk } from '../../queries/__generated__/CourseWithEnrollment';
import { ContentRow } from '../common/ContentRow';
import { PageBlock } from '../common/PageBlock';

import { Attendances } from './Attendances';
import CourseAchievementOption from './course-achievement-option/CourseAchievementOption';
import { CourseTitleSubTitleBlock } from './CourseTitleSubTitleBlock';
import { Resources } from './Resources';

interface IProps {
  course: CourseWithEnrollment_Course_by_pk;
}

export const CoursePageStudentView: FC<IProps> = ({ course }) => {
  const { t } = useTranslation();
  return (
    <>
      <PageBlock>
        <ContentRow leftTop={<CourseTitleSubTitleBlock course={course} />} />
        <ContentRow
          className="mt-16"
          leftTop={<div className="flex flex-1">{''}</div>}
          rightBottom={
            <div className="flex flex-1">
              <Resources course={course} />
            </div>
          }
        />
        <ContentRow
          className="my-24"
          leftTop={
            <div className="flex flex-1">
              <Attendances course={course} />
            </div>
          }
          rightBottom={
            <div className="flex flex-1">
              {course.achievementCertificatePossible && (
                <CourseAchievementOption
                  courseId={course.id}
                  achievementRecordUploadDeadline={
                    course.Program.achievementRecordUploadDeadline
                  }
                  courseTitle={course.title}
                  t={t}
                />
              )}
            </div>
          }
        />
      </PageBlock>
    </>
  );
};
