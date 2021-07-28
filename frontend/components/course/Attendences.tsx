import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import { FC } from "react";

import { CourseWithEnrollment_Course_by_pk } from "../../queries/__generated__/CourseWithEnrollment";
import { BlockTitle } from "../common/BlockTitle";

import { AttendenceEntry } from "./AttendenceEntry";

interface IProps {
  course: CourseWithEnrollment_Course_by_pk;
}

export const Attendences: FC<IProps> = ({ course }) => {
  const { keycloak } = useKeycloak<KeycloakInstance>();

  return (
    <div className="flex flex-col">
      <BlockTitle>Attendence</BlockTitle>
      <span className="text-lg mb-4">
        Du darfst an maximal {course.MaxMissedDates} Terminen fehlen, verdammt
        nochmal
      </span>
      <div>
        <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          {course.Sessions.map((session) => (
            <AttendenceEntry key={session.Id} session={session} />
          ))}
        </div>
      </div>
    </div>
  );
};
