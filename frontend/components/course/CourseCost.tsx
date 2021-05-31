import React from "react";
import { useTranslation } from "react-i18next";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseCost: React.FC<IProps> = ({ course }) => {
  const { t } = useTranslation("course-page");

  const cost =
    course.Cost !== "0"
      ? t("courseCosts", { price: course.Cost })
      : t("courseIsFree");

  return <>{cost}</>;
};
