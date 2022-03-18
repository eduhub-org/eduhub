import Head from "next/head";
import { FC } from "react";
import CoursesDashBoard from "../../components/courses/DashBoard";
import { Page } from "../../components/Page";
import { useAdminQuery } from "../../hooks/authedQuery";
import { ADMIN_PROGRAM_LIST } from "../../queries/programList";
import { ProgramListNoCourse } from "../../queries/__generated__/ProgramListNoCourse";

const Courses: FC = () => {
  // Database Calls
  const programListRequest = useAdminQuery<ProgramListNoCourse>(
    ADMIN_PROGRAM_LIST
  ); // Load Program list from db
  const ps = [...(programListRequest?.data?.Program || [])];
  if (programListRequest.loading) {
    return (
      <div>
        <Head>
          <title>Loading...</title>
        </Head>
        <Page />
      </div>
    );
  }
  if (ps.length <= 0) {
    return (
      <div>
        <Page>
          <h1> No Programs</h1>
        </Page>
      </div>
    );
  }
  return <CoursesDashBoard programs={ps} />;
};

export default Courses;
