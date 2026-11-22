import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { CourseSegment, courseSegment, manageCoursePath } from '../helpers/coursePath';

/**
 * Keeps the organizer URL on the segment that matches the course's program type,
 * so managing an event reads /manage/event/42 rather than /manage/course/42.
 *
 * Unlike the public page this one has no getServerSideProps — it is gated on the
 * session and loads through an authed hook — so there is no server redirect to
 * hang this on, and adding one would mean an authed server query for a page no
 * crawler ever sees. Correcting the URL once the course resolves is enough.
 */
export const useCanonicalManageCoursePath = (
  courseId: number,
  expectedSegment: CourseSegment,
  programType?: string | null
): void => {
  const router = useRouter();

  // Nothing to correct until the course has loaded; the page shows its loading
  // state meanwhile, so there is no flash of the wrong URL.
  const mismatched = programType != null && courseSegment(programType) !== expectedSegment;

  useEffect(() => {
    if (!mismatched) return;
    // `replace`, not `push`, or Back would bounce the organizer straight into
    // the redirect again. The hash is carried explicitly because router.replace
    // drops one that is not part of the url, and the project emails sent to
    // instructors and mentors deep-link to #projects.
    router.replace(`${manageCoursePath(courseId, programType)}${window.location.hash}`);
  }, [mismatched, courseId, programType, router]);
};
