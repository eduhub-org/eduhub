import { useQuery } from "@apollo/client";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Page } from "../../components/Page";
import { Button } from "../../components/common/Button";
import { ContentRow } from "../../components/common/ContentRow";
import { PageBlock } from "../../components/common/PageBlock";
import { CourseContentInfos } from "../../components/course/CourseContentInfos";
import { CourseEndTime } from "../../components/course/CourseEndTime";
import { CourseMetaInfos } from "../../components/course/CourseMetaInfos";
import { CourseStartTime } from "../../components/course/CourseStartTime";
import { CourseWeekday } from "../../components/course/CourseWeekday";
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
  const { t, i18n } = useTranslation("course-page");

  const id = parseInt(courseId as string, 10);

  const { data: courseData, loading, error } = useQuery<Course>(COURSE, {
    variables: {
      id,
    },
  });

  const course = courseData?.Course_by_pk;

  if (!course) {
    return <div>Kurs nicht verfügbar</div>;
  }

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
        <div className="flex flex-col space-y-24 mt-10">
          <PageBlock>
            <ContentRow
              className="items-center"
              leftTop={
                <div className="flex flex-1 flex-col">
                  <span className="text-xs">
                    <CourseWeekday course={course} />{" "}
                    <CourseStartTime course={course} />
                    {" - "}
                    <CourseEndTime course={course} />
                  </span>
                  <span className="text-5xl">{course.Name}</span>
                  <span className="text-2xl mt-2">
                    {course.ShortDescription}
                  </span>
                </div>
              }
              rightBottom={
                <div className="flex flex-1 flex-col justify-center items-center max-w-sm">
                  <Button filled>{t("applyNow")}</Button>
                  <span className="text-xs mt-4">
                    bewerbungsfrist{" "}
                    {course.BookingDeadline.toLocaleDateString(i18n.languages, {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </span>
                </div>
              }
            />
          </PageBlock>
          <ContentRow
            className="flex pb-24"
            leftTop={
              <PageBlock classname="flex-1">
                <CourseContentInfos course={course} />
              </PageBlock>
            }
            rightBottom={
              <div className="pr-0 lg:pr-6 xl:pr-0">
                <CourseMetaInfos course={course} />
              </div>
            }
          />
        </div>
      </Page>
    </div>
  );
};

export default CoursePage;
