import { useRouter } from 'next/router';
import { FC, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { MdVisibility } from 'react-icons/md';

import { useRoleMutation } from '../../../hooks/authedMutation';
import { REMOVE_TEST_ENROLLMENT } from '../../../queries/testEnrollment';

interface ParticipantPreviewNoticeProps {
  courseId: number;
}

/**
 * Says out loud that this page is a preview.
 *
 * Without it the preview is indistinguishable from the real thing: the page an
 * instructor sees while holding a preview enrollment is exactly the participant
 * page, which is the point - and precisely why they need telling that the
 * participant they are looking at is themselves.
 */
export const ParticipantPreviewNotice: FC<ParticipantPreviewNoticeProps> = ({ courseId }) => {
  const t = useTranslations('course.participant_preview');
  const router = useRouter();
  const [removeTestEnrollment, { loading }] = useRoleMutation(REMOVE_TEST_ENROLLMENT);

  const handleEnd = useCallback(async () => {
    await removeTestEnrollment({ variables: { courseId } });
    router.push(`/manage/course/${courseId}`);
  }, [courseId, removeTestEnrollment, router]);

  return (
    <div className="w-full bg-status-confirmed light text-label-primary">
      <div className="max-w-screen-xl mx-auto w-full flex flex-wrap items-center justify-between gap-3 px-6 py-3 xl:px-0">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <MdVisibility aria-hidden="true" />
          {t('notice')}
        </span>
        <button
          type="button"
          onClick={handleEnd}
          disabled={loading}
          className="min-h-11 rounded-full border-2 border-border-primary px-4 py-2 text-sm font-semibold transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
        >
          {t('end')}
        </button>
      </div>
    </div>
  );
};
