import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';

import { Page } from '../../components/layout/Page';
import ProjectContent from '../../components/pages/ProjectContent';

const ProjectPublicPage: FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const projectId = parseInt(id as string, 10);

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
        <meta property="og:title" content="EduHub | opencampus.sh" />
        <meta property="og:image" content="https://edu.opencampus.sh/images/edu_WISE23_HeaderWebsitePreview.png" />
      </Head>
      <Page>{Number.isFinite(projectId) ? <ProjectContent id={projectId} context="public" /> : null}</Page>
    </>
  );
};

export default ProjectPublicPage;
