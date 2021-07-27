import { FC } from "react";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { Button } from "../common/Button";
import { ContentRow } from "../common/ContentRow";
import { PageBlock } from "../common/PageBlock";

import { Attendences } from "./Attendences";
import { CourseTitleSubTitleBlock } from "./CourseTitleSubTitleBlock";
import { Resources } from "./Resources";
import { Tasks } from "./Tasks";

interface IProps {
  course: Course_Course_by_pk;
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
              <Button filled>zum Chat</Button>
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
