import { useTranslation } from "next-i18next";
import { FC } from "react";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";

import { ApplyButton } from "./ApplyButton";

interface IProps {
  course: Course_Course_by_pk;
}

export const ApplyButtonBlock: FC<IProps> = ({ course }) => {
  const { t, i18n } = useTranslation("course-page");
  return (
    <div className="flex flex-1 flex-col justify-center items-center max-w-sm">
      <ApplyButton course={course} />
      <span className="text-xs mt-4">
        {t("applicationDeadline")}{" "}
        {course.BookingDeadline?.toLocaleDateString(i18n.languages, {
          month: "2-digit",
          day: "2-digit",
        }) ?? ""}
      </span>
    </div>
  );
};
