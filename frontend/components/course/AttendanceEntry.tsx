import { FC } from "react";
import { useTranslation } from "react-i18next";

import { CourseWithEnrollment_Course_by_pk_Sessions } from "../../queries/__generated__/CourseWithEnrollment";

interface IProps {
  session: CourseWithEnrollment_Course_by_pk_Sessions;
}

export const AttendanceEntry: FC<IProps> = ({ session }) => {
  const { i18n } = useTranslation();

  const didParticipate =
    session.Attendences.length > 0 ? session.Attendences[0].Attending : null;
  const bgColor =
    didParticipate === null
      ? "bg-gray-200"
      : didParticipate
      ? "bg-edu-green"
      : "bg-edu-missed-yellow";

  const fontWeight = didParticipate ? "font-semibold" : "";

  const textColor = didParticipate === false ? "text-gray-500" : "";

  return (
    <span
      className={`text-sm ${fontWeight} ${textColor} text-center px-4 py-3 ${bgColor} rounded`}
    >
      {session.Start.toLocaleDateString(i18n.languages, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })}
    </span>
  );
};
