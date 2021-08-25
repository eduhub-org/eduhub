import { FC } from "react";
import { useTranslation } from "react-i18next";

import { AttendanceStatus_enum } from "../../__generated__/globalTypes";
import { CourseWithEnrollment_Course_by_pk_Sessions } from "../../queries/__generated__/CourseWithEnrollment";

interface IProps {
  session: CourseWithEnrollment_Course_by_pk_Sessions;
}

const { NO_INFO, ATTENDED, MISSED } = AttendanceStatus_enum;

export const AttendanceEntry: FC<IProps> = ({ session }) => {
  const { i18n } = useTranslation();

  const status =
    session.Attendences.length > 0 ? session.Attendences[0].Status : NO_INFO;
  const bgColor =
    status === NO_INFO
      ? "bg-gray-200"
      : status === ATTENDED
      ? "bg-edu-green"
      : "bg-edu-missed-yellow";

  const fontWeight = status === ATTENDED ? "font-semibold" : "";

  const textColor = status === MISSED ? "text-gray-500" : "";

  return (
    <span
      className={`text-sm ${fontWeight} ${textColor} text-center px-4 py-3 ${bgColor} rounded`}
    >
      {session.startDateTime.toLocaleDateString(i18n.languages, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })}
    </span>
  );
};
