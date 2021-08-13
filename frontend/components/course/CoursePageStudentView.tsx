import { FC } from "react";

import { CourseWithEnrollment_Course_by_pk } from "../../queries/__generated__/CourseWithEnrollment";
import { ContentRow } from "../common/ContentRow";
import { PageBlock } from "../common/PageBlock";

import { Attendences } from "./Attendences";
import { CourseTitleSubTitleBlock } from "./CourseTitleSubTitleBlock";
import { Resources } from "./Resources";
import { Tasks } from "./Tasks";
import { Tools } from "./Tools";

interface IProps {
  course: CourseWithEnrollment_Course_by_pk;
}

export const CoursePageStudentView: FC<IProps> = ({ course }) => {
  return (
    <>
      <PageBlock>
        <ContentRow leftTop={<CourseTitleSubTitleBlock course={course} />} />
        <ContentRow
          className="mt-16"
          leftTop={
            <div className="flex flex-1">
              <Tools course={course} />
            </div>
          }
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
              <Attendences course={course} />
            </div>
          }
          rightBottom={
            <div className="flex flex-1">
              <Tasks course={course} />
            </div>
          }
        />
      </PageBlock>
    </>
  );
};
