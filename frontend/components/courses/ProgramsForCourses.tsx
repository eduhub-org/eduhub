import { FC, useState } from "react";
import { useAdminQuery } from "../../hooks/authedQuery";
import { ADMIN_PROGRAM_LIST } from "../../queries/programList";
import { Programs } from "../../queries/__generated__/Programs";
import CoursesDashBoard from "./DashBoard";
import Loading from "./Loading";

const ProgramsForCourses: FC = () => {
  const programListRequest = useAdminQuery<Programs>(ADMIN_PROGRAM_LIST); // Load Program list from db

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
