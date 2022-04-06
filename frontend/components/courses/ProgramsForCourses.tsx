import { FC, useState } from "react";
import { useAdminQuery } from "../../hooks/authedQuery";
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from "../../queries/programList";
import { Programs } from "../../queries/__generated__/Programs";
import CoursesDashBoard from "./DashBoard";
import Loading from "./Loading";

const ProgramsForCourses: FC = () => {
  const programListRequest = useAdminQuery<Programs>(
    PROGRAMS_WITH_MINIMUM_PROPERTIES
  ); // Load Program list from db

  if (programListRequest.error) {
    console.log(programListRequest.error);
  }
  if (programListRequest.loading) {
    return <Loading />;
  }
  const ps = [...(programListRequest?.data?.Program || [])];
  return ps.length > 0 ? <CoursesDashBoard programs={ps} /> : <></>;
};

export default ProgramsForCourses;
