import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC } from "react";
import { Page } from "../../../components/Page";
import { useRouter } from "next/router";
import { useIsAdmin } from "../../../hooks/authentication";
import { AuthorizedManageCourse } from "../../../components/manageCourse/AuthorizedManageCourse";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
    props: {
        ...(await serverSideTranslations(locale, [
            "common",
        ])),
    },
});

export const getStaticPaths = async () => {
    return {
      // Only `/1` and `/2` are generated at build time
      paths: [{ params: { courseId: "1" } }, { params: { courseId: "2" } }],
      // Enable statically generating additional pages
      // For example: `/3`
      fallback: "blocking",
    };
  };

const ManageCoursePage: FC = () => {
    const router = useRouter();
    const { courseId, tab: tabParam } = router.query;

    const isAdmin = useIsAdmin(); // TODO probably should be "is course instructor" instead?

    return (
        <>
      <Head>
        <title>opencampus.sh Edu Hub</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
          {isAdmin ? <AuthorizedManageCourse courseId={Number(courseId)} /> :
           <div>You do not have the necessary rights to manage course {courseId}!</div>}
      </Page>
        </>
    )
};

export default ManageCoursePage;