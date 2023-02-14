import { FC } from 'react';

import { Course_Course_by_pk } from '../../queries/__generated__/Course';
import { ContentRow } from '../common/ContentRow';
import { PageBlock } from '../common/PageBlock';

import { CourseContentInfos } from './CourseContentInfos';
import { CourseMetaInfos } from './CourseMetaInfos';
import { CourseStatus } from './CourseStatus';
import { CourseTitleSubTitleBlock } from './CourseTitleSubTitleBlock';

interface IProps {
  course: Course_Course_by_pk;
}

export const CoursePageDescriptionView: FC<IProps> = ({ course }) => {
  return (
    <div className="flex flex-col space-y-24">
      <div className="flex flex-col">
        <img
          src={course.coverImage ?? 'https://picsum.photos/1280/620'}
          alt={course.title}
          width="1280px"
          height="620px"
          className="w-[1280px] h-[620px]"
        />
      </div>
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
          <PageBlock classname="flex-1">
            <CourseContentInfos course={course} />
          </PageBlock>
        }
        rightBottom={
          <div className="pr-0 lg:pr-6 xl:pr-0">
            <CourseMetaInfos course={course} />
          </div>
        }
      />
    </div>
  );
};
