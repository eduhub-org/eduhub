import path from 'path';
path.resolve('./next.config.js');

import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** @deprecated Use /manage/settings/programs — kept for bookmarks and external links. */
export default function ManageProgramsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/manage/settings/programs');
  }, [router]);

  return null;
}
