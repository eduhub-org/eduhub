// do not remove this https://github.com/nrwl/nx/issues/9017#issuecomment-1140066503
import path from 'path';
path.resolve('./next.config.js');

import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** @deprecated Use /manage/settings/access — kept for bookmarks and external links. */
export default function ManageAdminUsersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/manage/settings/access');
  }, [router]);

  return null;
}
