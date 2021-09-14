import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseCost: FC<IProps> = ({ course }) => {
  const { t } = useTranslation("course-page");

  const cost =
    course.cost !== "0"
      ? t("courseCosts", { price: course.cost })
      : t("courseIsFree");

  return <>{cost}</>;
};
