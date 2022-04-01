import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC } from "react";
import ProgramsForCourses from "../../components/courses/ProgramsForCourses";
import { Page } from "../../components/Page";
import { useIsAdmin } from "../../hooks/authentication";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

const Index: FC = () => {
  const isAdmin = useIsAdmin();
  return (
    <>
      <Head>
        <title>Courses: opencampus.sh Edu Hub </title>
      </Head>
      <Page>{isAdmin && <ProgramsForCourses />}</Page>
    </>
  );
};

export default Index;
