import { useTranslation } from "next-i18next";
import { FC } from "react";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { Button } from "../common/Button";

interface IProps {
  applyForCourse: () => void;
  course: Course_Course_by_pk;
  setText: (event: any) => void;
  text: string;
}

export const CourseApplicationModalFormContent: FC<IProps> = ({
  applyForCourse,
  course,
  setText,
  text,
}) => {
  const { t } = useTranslation("course-application");

  return (
    <>
      <span className="text-base mb-2">{t("applicationFor")}</span>
      <span className="text-3xl font-semibold">{course.title}</span>
      <span className="text-base">Anforderungen</span>
      <span className="text-sm">
        Anforderungen Hier ein Text über die Anforderungen für den Kurs. Wie
        lang ist der Text tatsächlich?
      </span>
      <span className="font-semibold mt-12">{t("motivationalText")}</span>
      <textarea
        onChange={setText}
        className="h-48 mt-3 bg-gray-100 focus:border-none"
        value={text}
        placeholder={t("motivationalTextPlaceholder")}
      />
      <div className="flex justify-center my-6">
        <Button filled onClick={applyForCourse}>
          {t("sendApplication")}
        </Button>
      </div>
    </>
  );
};
