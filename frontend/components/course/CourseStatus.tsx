import { useTranslation } from "next-i18next";
import { FC } from "react";

import { useIsLoggedIn } from "../../hooks/authentication";
import { Course_Course_by_pk } from "../../queries/__generated__/Course";

import { ApplyButton } from "./ApplyButton";
import { ApplyButtonBlock } from "./ApplyButtonBlock";
import { EnrollmentStatus } from "./EnrollmentStatus";

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseStatus: FC<IProps> = ({ course }) => {
  const isLoggedIn = useIsLoggedIn();
  const { t, i18n } = useTranslation("course-page");

  if (!isLoggedIn) {
    return <ApplyButtonBlock course={course} />;
  }

  return <EnrollmentStatus course={course} />;
};
