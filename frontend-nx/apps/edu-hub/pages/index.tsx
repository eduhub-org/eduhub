import Head from "next/head";
import { FC } from "react";
import useTranslation from 'next-translate/useTranslation';

import { LoginButton } from "../components/LoginButton";
import { Page } from "../components/Page";
import { RegisterButton } from "../components/RegisterButton";
import { Button } from "../components/common/Button";
import { OnlyLoggedIn } from "../components/common/OnlyLoggedIn";
import { OnlyLoggedOut } from "../components/common/OnlyLoggedOut";
import { MyCourses } from "../components/course/MyCourses";
import { TileSlider } from "../components/course/TileSlider";
import { useAuthedQuery } from "../hooks/authedQuery";
import { useIsLoggedIn } from "../hooks/authentication";
import { CourseList } from "../queries/__generated__/CourseList";
import { CourseListWithEnrollments } from "../queries/__generated__/CourseListWithEnrollments";
import { COURSE_LIST } from "../queries/courseList";
import { COURSE_LIST_WITH_ENROLLMENT } from "../queries/courseListWithEnrollment";
import { ClientOnly } from "@opencampus/shared-components";

const Home: FC = () => {
  const { t } = useTranslation("start-page");

  const isLoggedIn = useIsLoggedIn();

  const query = isLoggedIn ? COURSE_LIST_WITH_ENROLLMENT : COURSE_LIST;
  const {
    data: courses,
    error,
  } = useAuthedQuery<CourseList | CourseListWithEnrollments>(query);

  if (error) {
    console.log("got error in query for courses!", error);
  }

  const publishedCourses = courses?.Course?.filter(course => course.published === true) ?? [];


  return (
    <>
      <Head>
        <title>opencampus.sh Edu Hub</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        <div className="flex flex-col bg-[#F2991D] px-3">
          <span className="flex text-6xl sm:text-9xl mt-16 sm:mt-28">
            {t("headline")}
          </span>
          <div className="flex justify-center mt-4 mb-6 sm:mb-20">
            <span className="text-xl sm:text-5xl text-center">
              {t("subheadline")}
            </span>
          </div>
        </div>
        <ClientOnly>
          <OnlyLoggedIn>
          {courses?.Course?.length > 0 ?
            <>
              <h2 id="courses" className="text-2xl font-semibold text-left mt-20">
                {t("Course Organization")}
              </h2>
              <div className="mt-2">
                <TileSlider courses={publishedCourses} />
              </div>
            </>
          : null}
          </OnlyLoggedIn>
          <OnlyLoggedIn>
          {courses?.Course?.length > 0 ? 
            <>
              <h2 id="courses" className="text-2xl font-semibold text-left mt-20">
                {t("My Courses")}
              </h2>
              <div className="mt-2">
                <TileSlider courses={courses?.Course ?? []} />
              </div>
            </>
          : null}
          </OnlyLoggedIn>

          {courses?.Course?.length > 0 ? 
            <>
              <h2 id="courses" className="text-2xl font-semibold text-left mt-20">
                {t("Published Courses")}
              </h2>
              <div className="mt-2">
                <TileSlider courses={publishedCourses} />
              </div>
            </>
          : null}

          <OnlyLoggedOut>
            <div className="flex flex-col sm:flex-row mx-6 mt-6 mb-24 sm:mt-48">
              <div className="flex flex-1 flex-col sm:items-center">
                <div>
                  <h2 className="text-3xl font-semibold">
                    {t("continueLearning")}
                  </h2>
                  <h3 className="text-lg">{t("learnSubheadline")}</h3>
                </div>
              </div>
              <div className="flex flex-1 justify-center mt-8">
                <div className="flex justify-center items-center space-x-3">
                  <LoginButton />
                  <RegisterButton />
                </div>
              </div>
            </div>
          </OnlyLoggedOut>
        </ClientOnly>
      </Page>
    </>
  );
};

export default Home;
