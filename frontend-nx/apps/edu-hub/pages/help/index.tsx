import { GetServerSideProps } from 'next';

/**
 * The help docs live on GitBook. Send visitors there as a top-level page
 * instead of embedding GitBook in an iframe, so no third-party content (and
 * whatever it stores) runs inside EduHub.
 */
export const getServerSideProps: GetServerSideProps = async () => {
  // The build-time variable the Docker image and docker-compose actually set.
  const helpDocUrl = process.env.NEXT_PUBLIC_HELP_DOCS_URL;

  if (!helpDocUrl) {
    return { notFound: true };
  }

  return { redirect: { destination: helpDocUrl, permanent: false } };
};

const Help = () => null;

export default Help;
