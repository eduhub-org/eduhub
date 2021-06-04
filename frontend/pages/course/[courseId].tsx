import { useQuery } from "@apollo/client";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { useRouter } from "next/router";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Page } from "../../components/Page";
import { CoursePageDescriptionView } from "../../components/course/CoursePageDescriptionView";
import { CoursePageStudentView } from "../../components/course/CoursePageStudentView";
import { TabSelection } from "../../components/course/TabSelection";
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
  const { courseId, tab: tabParam } = router.query;
  const { t, i18n } = useTranslation("course-page");

  const id = parseInt(courseId as string, 10);
  const tab = typeof tabParam === "string" ? parseInt(tabParam, 10) : 0;

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
        <div className="py-4">
          <TabSelection
            currentTab={tab}
            tabs={["zur Kursbeschreibung", "laufender Kurs"]}
          />
        </div>
        {tab === 0 ? (
          <CoursePageDescriptionView course={course} />
        ) : (
          <CoursePageStudentView course={course} />
        )}
      </Page>
    </div>
  );
};

export default CoursePage;
