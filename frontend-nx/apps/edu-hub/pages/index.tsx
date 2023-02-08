import Head from "next/head";
import { FC, useEffect, useState } from "react";
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
import { useIsLoggedIn, useIsUser } from "../hooks/authentication";
import { CourseList } from "../queries/__generated__/CourseList";
import { CourseListWithEnrollments } from "../queries/__generated__/CourseListWithEnrollments";
import { COURSE_LIST } from "../queries/courseList";
import { COURSE_LIST_WITH_ENROLLMENT } from "../queries/courseListWithEnrollment";
import { ClientOnly } from "@opencampus/shared-components";
import { ApolloError } from "@apollo/client";
import { useSession } from 'next-auth/react';

const Home: FC = () => {
  const { t } = useTranslation("start-page");


  // Get Logged-In Status
  const useIsLoggedIn = (sessionData, status: "authenticated" | "loading" | "unauthenticated"): boolean => {
    return (status === 'authenticated' || false) && !!sessionData?.accessToken;
  };
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data, status } = useSession();
  const isLoggedIn = useIsLoggedIn(sessionData, status);
  useEffect(() => {
    setIsLoading(true);
    fetch("api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setSessionData(data);
        setIsLoading(false);
      });
  }, []);


  // Course Organization
  // TODO


  // My Courses
  const [enrolledCourses, setEnrolledCourses] = useState<CourseListWithEnrollments | null>(null);
  const [error_enrolled, setErrorEnrolled] = useState<ApolloError | null>(null);
  const { data: enrollmentData, error } = useAuthedQuery<CourseListWithEnrollments>(COURSE_LIST_WITH_ENROLLMENT);
  useEffect(() => {
    if (isLoggedIn && enrollmentData && !error && !isLoading) {
      const fetchData = async () => {
        try {
          setEnrolledCourses(enrollmentData);
        } catch (e) {
          setErrorEnrolled(error);
        }
      };
      fetchData();
    }
  }, [isLoggedIn, enrollmentData, error, isLoading]);

 
  if (error_enrolled) {
    console.log("got error in query for enrolled courses!", error_enrolled);
  }
  // const myCourses = enrolledCourses?.Course ?? [];
  // const myCourses = enrolledCourses?.Course?.filter(course => course.CourseEnrollments) ?? [];
  const {
    data: coursesList,
    error: coursesList_error,
  } = useAuthedQuery<CourseList>(COURSE_LIST_WITH_ENROLLMENT);
  if (coursesList_error) {
    console.log("got error in query for listed courses!", coursesList_error);
  }
  const myCourses = coursesList?.Course?.filter(course => course.CourseEnrollments.length>0) ?? [];
  // const myCourses = myCourses1.filter(course => course.en);


  // Published Courses
  const {
    data: courses,
    error: error_courses,
  } = useAuthedQuery<CourseList>(COURSE_LIST);
  if (error_courses) {
    console.log("got error in query for listed courses!", error_courses);
  }
  console.log("courses!", courses);
  const publishedCourses = courses?.Course?.filter(course => course.published === true && course.Program.published === true) ?? [];
  // const courseGroup1 = publishedCourses.filter(course => course.topicsTags?.includes("TECH_CODING"));
  // const courseGroup2 = publishedCourses.filter(course => course.topicsTags?.includes("BUSINESS_STARTUP"));
  // const courseGroup3 = publishedCourses.filter(course => course.topicsTags?.includes("CREATIVE_SOCIAL_SUSTAINABLE"));
  // const degrees = publishedCourses.filter(course => course.Program.shortTitle === "DEGREES");
  // const events = publishedCourses.filter(course => course.Program.shortTitle === "EVENTS");


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
          {/* <OnlyLoggedIn>
          {instructCourses.length > 0 ?
            <>
              <h2 id="courses" className="text-2xl font-semibold text-left mt-20">
                {t("Course Organization")}
              </h2>
              <div className="mt-2">
                <TileSlider courses={instructCourses} />
              </div>
            </>
          : null}
          </OnlyLoggedIn> */}
          <OnlyLoggedIn>
          {myCourses.length > 0 ? 
            <>
              <h2 id="courses" className="text-2xl font-semibold text-left mt-20">
                {t("My Courses")}
              </h2>
              <div className="mt-2">
                <TileSlider courses={myCourses} />
              </div>
            </>
          : null}
          </OnlyLoggedIn>

          {publishedCourses.length > 0 ? 
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
