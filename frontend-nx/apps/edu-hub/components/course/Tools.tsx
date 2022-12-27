import useTranslation from 'next-translate/useTranslation';
import { FC } from "react";

import { CourseWithEnrollment_Course_by_pk } from "../../queries/__generated__/CourseWithEnrollment";
import { Button } from "../common/Button";

interface IProps {
  course: CourseWithEnrollment_Course_by_pk;
}

export const Tools: FC<IProps> = ({ course }) => {
  const { t } = useTranslation("course-page");

  const videoLink = course.CourseLocations.find(
    (courseLocation) => !!courseLocation.link
  )?.link;

  return (
    <div className="flex flex-1 gap-x-4">
      {course.chatLink && (
        <Button
          as="a"
          filled
          href={course.chatLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("openChat")}
        </Button>
      )}
      {videoLink && (
        <Button
          as="a"
          filled
          href={videoLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("openVideoCall")}
        </Button>
      )}
    </div>
  );
};
