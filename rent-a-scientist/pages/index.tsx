import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Page } from "../components/Page";
import { useAuthedQuery } from "../hooks/authedQuery";
import { useIsLoggedIn } from "../hooks/authentication";
import { CourseList } from "../queries/__generated__/CourseList";
import { CourseListWithEnrollments } from "../queries/__generated__/CourseListWithEnrollments";
import { COURSE_LIST } from "../queries/courseList";
import { COURSE_LIST_WITH_ENROLLMENT } from "../queries/courseListWithEnrollment";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

const Home: FC = () => {
  const isLoggedIn = useIsLoggedIn();

  const query = isLoggedIn ? COURSE_LIST_WITH_ENROLLMENT : COURSE_LIST;
  const { data: courses, loading, error } = useAuthedQuery<
    CourseList | CourseListWithEnrollments
  >(query);

  if (error) {
    console.log("got error in query for courses!", error);
  }

  return (
    <>
      <Head>
        <title>Rent-A-Scientist</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        <div className="flex flex-col bg-rsa-background px-3">
          <span className="flex text-6xl sm:text-9xl mt-16 sm:mt-28">
            Rent-A-Scientist
          </span>
          <div className="flex justify-center mt-4 mb-6 sm:mb-20">
            <span className="text-xl sm:text-5xl text-center">
              21. Von Datum bis Datum
            </span>
          </div>
        </div>
      </Page>
    </>
  );
};

export default Home;
