import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import { useTranslation } from "next-i18next";
import { FC } from "react";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { BlockTitle } from "../common/BlockTitle";

import { AttendenceEntry } from "./AttendenceEntry";

interface IProps {
  course: Course_Course_by_pk;
}

export const Attendences: FC<IProps> = ({ course }) => {
  const { keycloak } = useKeycloak<KeycloakInstance>();
  const { t } = useTranslation("course-page");

  return (
    <div className="flex flex-col">
      <BlockTitle>{t("attendence")}</BlockTitle>
      <span className="text-lg mb-4">
        {t("maxMissedDates", { count: course.MaxMissedDates })}
      </span>
      <div>
        <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          {course.Sessions.map((session) => (
            <AttendenceEntry
              key={session.Id}
              session={session}
              attendence={null}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
