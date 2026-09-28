import { useRouter } from 'next/router';
import { FC, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MdVisibility } from 'react-icons/md';

import { ErrorMessageDialog } from '../common/dialogs/ErrorMessageDialog';
import { useParticipantPreview } from '../../contexts/ParticipantPreviewContext';
import { useRoleMutation } from '../../hooks/authedMutation';
import { useUserId } from '../../hooks/user';
import { MY_TEST_ENROLLMENT, REMOVE_TEST_ENROLLMENT } from '../../queries/testEnrollment';
import { RemoveTestEnrollment, RemoveTestEnrollmentVariables } from '../../queries/__generated__/RemoveTestEnrollment';

/**
 * Says out loud that this page is a preview.
 *
 * Without it the preview is indistinguishable from the real thing: the page an
 * instructor sees while holding a preview enrollment is exactly the participant
 * page, which is the point - and precisely why they need telling that the
 * participant they are looking at is themselves.
 *
 * Rendered by Page above the header rather than by the course page inside it,
 * because the header is absolutely positioned over the top of `<main>` and would
 * otherwise cover this bar and its button. The course page declares the preview
 * through ParticipantPreviewContext.
 */
export const ParticipantPreviewNotice: FC = () => {
  const t = useTranslations('course.participant_preview');
  const router = useRouter();
  const userId = useUserId();
  const { courseId } = useParticipantPreview();
  const [errorMessage, setErrorMessage] = useState('');
  const [removeTestEnrollment, { loading }] = useRoleMutation<RemoveTestEnrollment, RemoveTestEnrollmentVariables>(
    REMOVE_TEST_ENROLLMENT
  );

  // The same three things ParticipantPreviewButton.handleRemove does, because
  // this is the same removal: read the payload (the action reports refusal in
  // it rather than by throwing), refresh what the manage screen will read back
  // -- MY_TEST_ENROLLMENT is cache-first, so the page this navigates to would
  // otherwise still offer to open a preview that is gone -- and only then go.
  const handleEnd = useCallback(async () => {
    if (courseId == null) return;
    try {
      const result = await removeTestEnrollment({
        variables: { courseId },
        refetchQueries: userId ? [{ query: MY_TEST_ENROLLMENT, variables: { courseId, userId } }] : [],
        awaitRefetchQueries: true,
      });
      const payload = result.data?.removeTestEnrollment;
      if (!payload?.success) {
        setErrorMessage(t(`errors.${payload?.messageKey ?? 'TEST_ENROLLMENT_FAILED'}`));
        return;
      }
      router.push(`/manage/course/${courseId}`);
    } catch {
      setErrorMessage(t('errors.TEST_ENROLLMENT_FAILED'));
    }
  }, [courseId, removeTestEnrollment, router, t, userId]);

  if (courseId == null) return null;

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
      <ErrorMessageDialog open={errorMessage !== ''} errorMessage={errorMessage} onClose={() => setErrorMessage('')} />
    </div>
  );
};
