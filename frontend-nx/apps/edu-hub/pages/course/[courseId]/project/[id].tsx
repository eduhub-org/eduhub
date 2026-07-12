import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';

import { Page } from '../../../../components/layout/Page';
import ProjectContent from '../../../../components/pages/ProjectContent';

const ProjectWithinCoursePage: FC = () => {
  const router = useRouter();
  const { id, courseId } = router.query;
  const projectId = parseInt(id as string, 10);
  const parsedCourseId = parseInt(courseId as string, 10);

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
        <meta property="og:title" content="EduHub | opencampus.sh" />
        <meta property="og:image" content="https://edu.opencampus.sh/images/edu_WISE23_HeaderWebsitePreview.png" />
      </Head>
      <Page>
        {Number.isFinite(projectId) ? (
          <ProjectContent
            id={projectId}
            context="withinCourse"
            courseId={Number.isFinite(parsedCourseId) ? parsedCourseId : undefined}
          />
        ) : null}
      </Page>
    </>
  );
};

export default ProjectWithinCoursePage;
