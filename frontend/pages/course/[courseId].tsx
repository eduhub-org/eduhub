import { useQuery } from "@apollo/client";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Page } from "../../components/Page";
import { Button } from "../../components/common/Button";
import { CourseContentInfos } from "../../components/course/CourseContentInfos";
import { CourseMetaInfos } from "../../components/course/CourseMetaInfos";
import { Course } from "../../queries/__generated__/Course";
import { COURSE } from "../../queries/course";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common", "course-page"])),
  },
});

export const getStaticPaths = async () => {
  return {
    // Only `/posts/1` and `/posts/2` are generated at build time
    paths: [{ params: { courseId: "1" } }, { params: { courseId: "2" } }],
    // Enable statically generating additional pages
    // For example: `/posts/3`
    fallback: "blocking",
  };
};

const CoursePage: FC = () => {
  const router = useRouter();
  const { courseId } = router.query;
  const { t } = useTranslation("course-page");
  const { t: commonT } = useTranslation("common");

  const id = parseInt(courseId as string, 10);

  const { data: courseData, loading, error } = useQuery<Course>(COURSE, {
    variables: {
      id,
    },
  });

  const course = courseData?.Course_by_pk;

  if (!course) {
    return "Kurs nicht verfügbar";
  }

  console.log("kurs:", course);

  const weekday = course.DayOfTheWeek ? commonT(course.DayOfTheWeek) : "";

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        <div className="flex flex-col">
          <Image
            src={course.Image ?? "https://picsum.photos/1280/620"}
            alt="Title image"
            width={1280}
            height={620}
          />
        </div>
        <div className="flex flex-col sm:mx-16">
          <div className="flex my-10">
            <div className="flex flex-1 flex-col">
              <span className="text-xs">
                {weekday} - {course.TimeOfStart} Montags 18:00 - 19:30
              </span>
              <span className="text-5xl">{course.Name}</span>
              <span className="text-2xl mt-2">{course.ShortDescription}</span>
            </div>
            <div className="flex flex-1 flex-col justify-center items-center max-w-sm">
              <Button filled>{t("applyNow")}</Button>
              <span className="text-xs mt-4">bewerbungsfrist 4.5.2021</span>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row mb-24">
            <CourseContentInfos course={course} />
            <div>
              <CourseMetaInfos />
            </div>
          </div>
        </div>
      </Page>
    </div>
  );
};

export default CoursePage;
