import { useTranslation } from "next-i18next";
import { FC } from "react";

import { getWeekdayStartAndEndString } from "../../helpers/dateHelpers";
import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { BlockTitle } from "../common/BlockTitle";

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseTitleSubTitleBlock: FC<IProps> = ({ course }) => {
  const { t, i18n } = useTranslation();
  return (
    <div className="flex flex-1 flex-col">
      <span className="text-xs">
        {getWeekdayStartAndEndString(course, i18n, t)}
      </span>
      <BlockTitle>{course.Name}</BlockTitle>
      <span className="text-2xl mt-2">{course.ShortDescription}</span>
    </div>
  );
};
