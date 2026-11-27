import { GetServerSideProps } from 'next';

/** @deprecated Projects moved to /manage/projects — kept for bookmarks and external links. */
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/manage/projects', permanent: false },
});

export default function ProjectsSettingsRedirect() {
  return null;
}
