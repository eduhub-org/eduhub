import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC } from "react";
import CoursesDashBoard from "../../components/courses/DashBoard";
import { Page } from "../../components/Page";
import { useAdminQuery } from "../../hooks/authedQuery";
import { ADMIN_PROGRAM_LIST } from "../../queries/programList";
import { ProgramListNoCourse } from "../../queries/__generated__/ProgramListNoCourse";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

const Courses: FC = () => {
  // Database Calls
  const programListRequest = useAdminQuery<ProgramListNoCourse>(
    ADMIN_PROGRAM_LIST
  ); // Load Program list from db

  if(programListRequest.error) {
    console.log(programListRequest)
  }
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
        <Head>
          <title>No available course !</title>
        </Head>
        <Page>
          <h1> No Programs</h1>
        </Page>
      </div>
    );
  }
  return <CoursesDashBoard programs={ps} />;
};

export default Courses;
