import { useTranslation } from "next-i18next";
import { FC } from "react";

import { CourseWithEnrollment_Course_by_pk } from "../../queries/__generated__/CourseWithEnrollment";
import { Button } from "../common/Button";

interface IProps {
  course: CourseWithEnrollment_Course_by_pk;
}

export const Tools: FC<IProps> = ({ course }) => {
  const { t } = useTranslation("course-page");

  return (
    <div className="flex flex-1 gap-x-4">
      {course.LinkChat && (
        <Button as="a" filled href={course.LinkChat} target="_blank">
          {t("openChat")}
        </Button>
      )}
      {course.LinkVideoCall && (
        <Button as="a" filled href={course.LinkVideoCall} target="_blank">
          {t("openVideoCall")}
        </Button>
      )}
    </div>
  );
};
