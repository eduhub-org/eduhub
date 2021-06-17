import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { Button } from "../common/Button";
import { ContentRow } from "../common/ContentRow";
import { PageBlock } from "../common/PageBlock";

import { CourseContentInfos } from "./CourseContentInfos";
import { CourseMetaInfos } from "./CourseMetaInfos";
import { CourseTitleSubTitleBlock } from "./CourseTitleSubTitleBlock";

interface IProps {
  course: Course_Course_by_pk;
}

export const CoursePageDescriptionView: FC<IProps> = ({ course }) => {
  const { t, i18n } = useTranslation("course-page");

  return (
    <div className="flex flex-col space-y-24 mt-10">
      <PageBlock>
        <ContentRow
          className="items-center"
          leftTop={<CourseTitleSubTitleBlock course={course} />}
          rightBottom={
            <div className="flex flex-1 flex-col justify-center items-center max-w-sm">
              <Button filled>{t("applyNow")}</Button>
              <span className="text-xs mt-4">
                {t("applicationDeadline")}{" "}
                {course.BookingDeadline.toLocaleDateString(i18n.languages, {
                  month: "2-digit",
                  day: "2-digit",
                })}
              </span>
            </div>
          }
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
