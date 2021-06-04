import { Session } from "node:inspector";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";

interface IProps {
  course: Course_Course_by_pk;
}

export const Attendences: FC<IProps> = ({ course }) => {
  const { t, i18n } = useTranslation("course-page");

  return (
    <div className="flex flex-col">
      <span className="text-5xl">Attendence</span>
      <span className="text-lg">
        Du darfst an maximal {course.MaxMissedDates} Terminen fehlen, verdammt
        nochmal
      </span>
      <div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          {course.Sessions.map((session) => (
            <span
              key={session.Id}
              className="text-sm font-semibold text-center px-4 py-2 bg-edu-green rounded"
            >
              {session.Start.toLocaleDateString(i18n.languages, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
