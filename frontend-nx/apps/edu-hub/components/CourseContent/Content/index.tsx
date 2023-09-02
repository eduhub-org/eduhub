import { Dispatch, FC, SetStateAction } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { Course_Course_by_pk } from '../../../queries/__generated__/Course';
import { CourseWithEnrollment_Course_by_pk } from '../../../queries/__generated__/CourseWithEnrollment';

import { ContentRow } from '../../common/ContentRow';
import { PageBlock } from '../../common/PageBlock';

import { DescriptionFields } from './DescriptionFields';
import { TimeLocationLanguageInstructors } from './TimeLocationLanguageInstructors';
import { ApplicationButtonOrStatusMessageOrLinks } from './ApplicationButtonOrStatusMessageOrLinks';
import { AttendancesAndAchievements } from './AttendancesAndAchievements';

import { useIsCourseWithEnrollment } from '../../../hooks/course';
import { getWeekdayStartAndEndString } from '../../../helpers/dateHelpers';
import { LearningGoals } from './LearningGoals';
import { Sessions } from './Sessions';
import { DegreeCourses } from './DegreeCourses';

interface TaglineProps {
  course: Course_Course_by_pk;
}
export const Tagline: FC<TaglineProps> = ({ course }) => {
  const { t, lang } = useTranslation();
  return (
    <div className="flex flex-1 flex-col text-white mb-20">
      {course.weekDay !== 'NONE' ? (
        <span className="text-xs">
          {getWeekdayStartAndEndString(course, lang, t)}
        </span>
      ) : null}
      <span className="text-2xl mt-2">{course.tagline}</span>
    </div>
  );
};

interface ContentProps {
  course: Course_Course_by_pk | CourseWithEnrollment_Course_by_pk;
  setInvitationModalOpen?: Dispatch<SetStateAction<boolean>>;
}
export const Content: FC<ContentProps> = ({
  course,
  setInvitationModalOpen,
}) => {
  const { t } = useTranslation();
  const { title, coverImage } = course;

  const isCourseWithEnrollment = useIsCourseWithEnrollment(course);

  const bgUrl = coverImage ?? 'https://picsum.photos/1280/620';

  return (
    <div className="flex flex-col space-y-24">
      <div
        className="h-96 p-3 text-3xl text-white flex justify-start items-end bg-cover bg-center bg-no-repeat bg-[image:var(--bg-small-url)]"
        style={
          {
            '--bg-small-url': `linear-gradient(51.32deg, rgba(0, 0, 0, 0.7) 17.57%, rgba(0, 0, 0, 0) 85.36%), url(${bgUrl})`,
          } as React.CSSProperties
        }
      >
        <div className="max-w-screen-xl mx-auto w-full">{title}</div>
      </div>
      <div className="max-w-screen-xl mx-auto w-full">
        <PageBlock>
          <ContentRow className="items-center">
            <Tagline course={course} />
            <ApplicationButtonOrStatusMessageOrLinks
              course={course}
              setInvitationModalOpen={setInvitationModalOpen}
            />
          </ContentRow>
        </PageBlock>
        {isCourseWithEnrollment && (
          <AttendancesAndAchievements course={course} />
        )}
        <ContentRow className="flex">
          <PageBlock classname="flex-1 text-white space-y-6">
            <LearningGoals learningGoals={course.learningGoals}/>
            <Sessions sessions={course.Sessions} />
            <DegreeCourses degreeCourses={course.DegreeCourses}/>
          </PageBlock>
          <div className="pr-0 lg:pr-6 xl:pr-0">
            <TimeLocationLanguageInstructors course={course} />
          </div>
        </ContentRow>
        <DescriptionFields course={course} />
      </div>
    </div>
  );
};

export default Content;
