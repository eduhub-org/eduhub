import type { GetServerSidePropsContext } from 'next';

import { getServerSideProps } from '../../../../pages/manage/settings/projects';

describe('/manage/settings/projects', () => {
  it('redirects to the projects overview', async () => {
    await expect(getServerSideProps({} as GetServerSidePropsContext)).resolves.toEqual({
      redirect: { destination: '/manage/projects', permanent: false },
    });
  });
});
