import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { CircularProgress } from '@mui/material';

import { Page } from '../../layout/Page';
import CourseContent from './index';
import { useIsSessionLoading } from '../../../hooks/authentication';
import { withAuthRedirect } from '../../../helpers/auth';
import { createServerApolloClient } from '../../../config/apolloServer';
import { COURSE_SEO } from '../../../queries/courseSeo';
import { getPublicImageUrl } from '../../../helpers/filehandling';
import { buildCourseStructuredData, StructuredDataCourse } from '../../../helpers/courseStructuredData';
import { requestOrigin } from '../../../helpers/requestOrigin';
import { CourseSegment, courseUrl } from '../../../helpers/coursePath';
import { courseRedirectDestination } from '../../../helpers/courseRedirect';

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

/**
 * The page's own data still loads client-side through Apollo. This fetch exists
 * only so the title, the social preview and the JSON-LD are in the initial HTML,
 * where crawlers that do not run JavaScript can see them. It is best-effort: any
 * failure falls back to the generic metadata rather than breaking the page.
 *
 * It doubles as the source for the canonical URL: the same `Program.type` that
 * picks the schema.org type picks the path segment, so `expectedSegment` can be
 * checked here without a second query.
 */
const loadCourseSeo = async (
  context: GetServerSidePropsContext,
  expectedSegment: CourseSegment
): Promise<GetServerSidePropsResult<CoursePageProps>> => {
  const empty: GetServerSidePropsResult<CoursePageProps> = { props: { seo: null, structuredData: null } };
  const courseId = parseInt(context.params?.courseId as string, 10);
  if (Number.isNaN(courseId)) return empty;

  try {
    const { data } = await createServerApolloClient().query({
      query: COURSE_SEO,
      variables: { id: courseId },
    });

    // The anonymous role only returns published courses in published programs,
    // so an unpublished one lands here and keeps the generic metadata. Its
    // program type is unknown too, which is why it is not redirected: a signed-in
    // organizer previewing a draft stays on whichever segment they opened.
    const course = data?.Course_by_pk as StructuredDataCourse | null;
    if (!course) return empty;

    const programType = course.Program?.type;
    const destination = courseRedirectDestination({
      expectedSegment,
      id: course.id,
      programType,
      resolvedUrl: context.resolvedUrl,
      locale: context.locale,
      defaultLocale: context.defaultLocale,
    });

    // Temporary (307), not permanent: an organizer can move a course to a program
    // of another type, and a 308 would stay in browser caches long after that.
    // The canonical tag below is what consolidates the three paths for crawlers.
    if (destination) return { redirect: { destination, permanent: false } };

    const siteUrl = requestOrigin(context.req);
    return {
      props: {
        seo: {
          title: `${course.title} | EduHub`,
          description: (course.tagline || '').trim() || null,
          image: getPublicImageUrl(course.coverImage ?? null, 1280) ?? FALLBACK_IMAGE,
          canonicalUrl: courseUrl(course.id, programType, siteUrl),
        },
        structuredData: buildCourseStructuredData(course, { siteUrl }),
      },
    };
  } catch (error) {
    console.error('Failed to load course SEO data', error);
    return empty;
  }
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
            // Course text is editable by instructors and org admins, so `<` is
            // escaped to keep it from closing this script tag.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
          />
        )}
      </Head>
      <Page>{isSessionLoading ? <CircularProgress /> : <CourseContent id={id} />}</Page>
    </>
  );
};

/**
 * One page under three paths. `/course/:id`, `/event/:id` and `/degree/:id` all
 * render this; whichever does not match the course's own program type redirects
 * to the one that does, so a link that predates the split still arrives.
 */
export const createCourseRoute = (expectedSegment: CourseSegment) => {
  const getServerSideProps: GetServerSideProps = async (context) =>
    withAuthRedirect({ redirectTo: `${context.resolvedUrl}` })((innerContext) =>
      loadCourseSeo(innerContext, expectedSegment)
    )(context);

  return { getServerSideProps, Page: CoursePage };
};
