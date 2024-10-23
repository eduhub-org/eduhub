import { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import CourseContent from '../../../../components/pages/CourseContent';
import { Page } from '../../../../components/layout/Page';
import { getIsLoggedIn } from '../../../../helpers/auth';
import { CircularProgress } from '@mui/material';
import getT from 'next-translate/getT';

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const t = await getT(params.lang, ['metadata']);

  return {
    title: t('metadata:course.title'),
    description: t('metadata:course.description'),
  };
}

async function CoursePage({ params }: { params: { courseId: string; lang: string } }) {
  const isLoggedIn = await getIsLoggedIn();

  if (!isLoggedIn) {
    redirect(`/${params.lang}/login?redirectTo=/${params.lang}/course/${params.courseId}`);
  }

  const id = parseInt(params.courseId, 10);

  return (
    <Page>
      <Suspense fallback={<CircularProgress />}>
        <CourseContent id={id} />
      </Suspense>
    </Page>
  );
}

export default CoursePage;
