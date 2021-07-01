import { useTranslation } from "next-i18next";
import { FC } from "react";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { Button } from "../common/Button";

interface IProps {
  course: Course_Course_by_pk;
  onClickApply: () => void;
}

export const ApplyButtonBlock: FC<IProps> = ({ course, onClickApply }) => {
  const { t, i18n } = useTranslation("course-page");
  return (
    <div className="flex flex-1 flex-col justify-center items-center">
      <Button filled onClick={onClickApply}>
        {t("applyNow")}
      </Button>
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
