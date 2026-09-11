import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { Page } from '../../components/layout/Page';
import CourseContent from '../../components/pages/CourseContent/index';
import { useIsSessionLoading } from '../../hooks/authentication';
import { CircularProgress } from '@mui/material';
import { withAuthRedirect } from '../../helpers/auth';
import { createServerApolloClient } from '../../config/apolloServer';
import { COURSE_SEO } from '../../queries/courseSeo';
import { getPublicImageUrl } from '../../helpers/filehandling';
import { buildCourseStructuredData, StructuredDataCourse } from '../../helpers/courseStructuredData';

const FALLBACK_TITLE = 'EduHub | opencampus.sh';
const FALLBACK_IMAGE = 'https://edu.opencampus.sh/images/edu_WiSe2627_header_preview.jpg';

interface CoursePageProps {
  seo: {
    title: string;
    description: string | null;
    image: string;
    canonicalUrl: string;
  } | null;
  structuredData: Record<string, any> | null;
}

/** Origin of the current request, so staging and preview hosts stay self-consistent. */
const requestOrigin = (context: GetServerSidePropsContext): string => {
  const forwardedProto = context.req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)?.split(',')[0] ?? 'https';
  const host = context.req.headers.host ?? 'edu.opencampus.sh';
  return `${proto}://${host}`;
};

/**
 * The page's own data still loads client-side through Apollo. This fetch exists
 * only so the title, the social preview and the JSON-LD are in the initial HTML,
 * where crawlers that do not run JavaScript can see them. It is best-effort: any
 * failure falls back to the generic metadata rather than breaking the page.
 */
const loadCourseSeo = async (context: GetServerSidePropsContext): Promise<CoursePageProps> => {
  const empty: CoursePageProps = { seo: null, structuredData: null };
  const courseId = parseInt(context.params?.courseId as string, 10);
  if (Number.isNaN(courseId)) return empty;

  try {
    const { data } = await createServerApolloClient().query({
      query: COURSE_SEO,
      variables: { id: courseId },
    });

    // The anonymous role only returns published courses in published programs,
    // so an unpublished one lands here and keeps the generic metadata.
    const course = data?.Course_by_pk as StructuredDataCourse | null;
    if (!course) return empty;

    const siteUrl = requestOrigin(context);
    return {
      seo: {
        title: `${course.title} | EduHub`,
        description: (course.tagline || '').trim() || null,
        image: getPublicImageUrl(course.coverImage ?? null, 1280) ?? FALLBACK_IMAGE,
        canonicalUrl: `${siteUrl}/course/${course.id}`,
      },
      structuredData: buildCourseStructuredData(course, { siteUrl }),
    };
  } catch (error) {
    console.error('Failed to load course SEO data', error);
    return empty;
  }
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirectTo = `${context.resolvedUrl}`;
  return withAuthRedirect({ redirectTo })(async (innerContext) => ({
    props: await loadCourseSeo(innerContext),
  }))(context);
};

const CoursePage: FC<CoursePageProps> = ({ seo, structuredData }) => {
  const router = useRouter();
  const { courseId } = router.query;

  const isSessionLoading = useIsSessionLoading();

  const id = parseInt(courseId as string, 10);
  const title = seo?.title ?? FALLBACK_TITLE;
  const image = seo?.image ?? FALLBACK_IMAGE;

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.png" />
        {seo?.canonicalUrl && <link rel="canonical" href={seo.canonicalUrl} />}
        {seo?.description && <meta name="description" content={seo.description} />}
        <meta property="og:title" content={title} />
        {seo?.description && <meta property="og:description" content={seo.description} />}
        <meta property="og:image" content={image} />
        {seo?.canonicalUrl && <meta property="og:url" content={seo.canonicalUrl} />}
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
      </Head>
      <Page>{isSessionLoading ? <CircularProgress /> : <CourseContent id={id} />}</Page>
    </>
  );
};

export default CoursePage;
