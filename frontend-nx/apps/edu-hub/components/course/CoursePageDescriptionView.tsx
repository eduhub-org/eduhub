import { FC } from 'react';

import { Course_Course_by_pk } from '../../queries/__generated__/Course';
import { ContentRow } from '../common/ContentRow';
import { PageBlock } from '../common/PageBlock';

import { CourseContentInfos } from './CourseContentInfos';
import { CourseDescriptionInfos } from './CourseDescriptionInfos';
import { CourseMetaInfos } from './CourseMetaInfos';
import { CourseStatus } from './CourseStatus';
import { CourseTitleSubTitleBlock } from './CourseTitleSubTitleBlock';

interface IProps {
  course: Course_Course_by_pk;
}

export const CoursePageDescriptionView: FC<IProps> = ({ course }) => {
  return (
    <div className="flex flex-col space-y-24">
      <div
        className="h-96 p-3 text-3xl text-white flex justify-start items-end bg-cover bg-center bg-no-repeat bg-[image:var(--bg-small-url)]"
        style={
          {
            '--bg-small-url': `linear-gradient(51.32deg, rgba(0, 0, 0, 0.7) 17.57%, rgba(0, 0, 0, 0) 85.36%), url(${
              course.coverImage ?? 'https://picsum.photos/1280/620'
            })`,
          } as React.CSSProperties
        }
      >
        <div className="max-w-screen-xl mx-auto w-full">{course.title}</div>
      </div>
      <div className="max-w-screen-xl mx-auto w-full">
        <PageBlock>
          <ContentRow
            className="items-center"
            leftTop={<CourseTitleSubTitleBlock course={course} />}
            rightBottom={<CourseStatus course={course} />}
          />
        </PageBlock>
        <ContentRow
          className="flex pb-24"
          leftTop={
            <PageBlock classname="flex-1 text-white">
              <CourseContentInfos course={course} />
            </PageBlock>
          }
          rightBottom={
            <div className="pr-0 lg:pr-6 xl:pr-0">
              <CourseMetaInfos course={course} />
            </div>
          }
        />
        <CourseDescriptionInfos course={course} />
      </div>
    </div>
  );
};
