import { useTranslation } from "next-i18next";
import { FC, useCallback } from "react";

import { CourseWithEnrollment_Course_by_pk } from "../../queries/__generated__/CourseWithEnrollment";
import { Button } from "../common/Button";

interface IProps {
  course: CourseWithEnrollment_Course_by_pk;
}

export const Tools: FC<IProps> = ({ course }) => {
  const { t } = useTranslation("course-page");

  const openChat = useCallback(() => {
    if (!course.LinkChat) {
      return;
    }

    window.open(course.LinkChat);
  }, [course.LinkChat]);

  const openVideoCall = useCallback(() => {
    if (!course.LinkVideoCall) {
      return;
    }

    window.open(course.LinkVideoCall);
  }, [course.LinkVideoCall]);

  return (
    <div className="flex flex-1 gap-x-4">
      {course.LinkChat && (
        <Button filled onClick={openChat}>
          {t("openChat")}
        </Button>
      )}
      {course.LinkVideoCall && (
        <Button filled onClick={openVideoCall}>
          {t("openVideoCall")}
        </Button>
      )}
    </div>
  );
};
