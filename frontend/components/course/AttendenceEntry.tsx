import { FC } from "react";
import { useTranslation } from "react-i18next";

interface IProps {
  session: any;
  attendence: any;
}

export const AttendenceEntry: FC<IProps> = ({ attendence, session }) => {
  const { i18n } = useTranslation();

  const didParticipate = false;
  const isInFuture = false;
  const bgColor = isInFuture
    ? "bg-gray-200"
    : didParticipate
    ? "bg-edu-green"
    : "bg-edu-missed-yellow";

  const fontWeight = didParticipate ? "font-semibold" : "";

  const textColor = !isInFuture && !didParticipate ? "text-gray-500" : "";

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
