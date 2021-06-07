import Image from "next/image";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { Button } from "../common/Button";
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
    <>
      <div className="flex flex-col">
        <Image
          src={course.Image ?? "https://picsum.photos/1280/620"}
          alt="Title image"
          width={1280}
          height={620}
        />
      </div>
      <PageBlock>
        <div className="flex flex-col">
          <div className="flex my-10">
            <CourseTitleSubTitleBlock course={course} />
            <div className="flex flex-1 flex-col justify-center items-center max-w-sm">
              <Button filled>{t("applyNow")}</Button>
              <span className="text-xs mt-4">
                bewerbungsfrist{" "}
                {course.BookingDeadline.toLocaleDateString(i18n.languages, {
                  month: "2-digit",
                  day: "2-digit",
                })}
              </span>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row mb-24 space-x-6">
            <CourseContentInfos course={course} />
            <div>
              <CourseMetaInfos course={course} />
            </div>
          </div>
        </div>
      </PageBlock>
    </>
  );
};
