import { useRouter } from 'next/router';
import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '../../common/Button';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { useUserId } from '../../../hooks/user';
import { CREATE_TEST_ENROLLMENT, MY_TEST_ENROLLMENT, REMOVE_TEST_ENROLLMENT } from '../../../queries/testEnrollment';
import { MyTestEnrollment, MyTestEnrollmentVariables } from '../../../queries/__generated__/MyTestEnrollment';
import {
  CreateTestEnrollment,
  CreateTestEnrollmentVariables,
} from '../../../queries/__generated__/CreateTestEnrollment';
import {
  RemoveTestEnrollment,
  RemoveTestEnrollmentVariables,
} from '../../../queries/__generated__/RemoveTestEnrollment';

interface ParticipantPreviewButtonProps {
  courseId: number;
}

/**
 * Lets whoever manages this course see it as a participant does.
 *
 * The participant surface is enforced server-side - the participant directory,
 * the session online links and the whole project flow all require the requesting
 * user to hold a CONFIRMED enrollment - so previewing it means really being
 * enrolled. The enrollment this creates carries `isTest`, which keeps it out of
 * every count, list, export, certificate run and mail (see migration
 * 1789646311423 and the guards in functions/).
 */
export const ParticipantPreviewButton: FC<ParticipantPreviewButtonProps> = ({ courseId }) => {
  const t = useTranslations('manageCourse.participant_preview');
  const router = useRouter();
  const userId = useUserId();

  const [confirming, setConfirming] = useState<'create' | 'remove' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const queryOptions = useMemo(
    () => ({ variables: { courseId, userId: userId ?? '' }, skip: !userId }),
    [courseId, userId]
  );
  const { data, refetch } = useRoleQuery<MyTestEnrollment, MyTestEnrollmentVariables>(MY_TEST_ENROLLMENT, queryOptions);
  const hasPreview = (data?.CourseEnrollment?.length ?? 0) > 0;

  const [createTestEnrollment, { loading: creating }] = useRoleMutation<
    CreateTestEnrollment,
    CreateTestEnrollmentVariables
  >(CREATE_TEST_ENROLLMENT);
  const [removeTestEnrollment, { loading: removing }] = useRoleMutation<
    RemoveTestEnrollment,
    RemoveTestEnrollmentVariables
  >(REMOVE_TEST_ENROLLMENT);

  const coursePath = `/course/${courseId}`;

  const handleCreate = useCallback(async () => {
    setConfirming(null);
    try {
      const result = await createTestEnrollment({ variables: { courseId } });
      const payload = result.data?.createTestEnrollment;
      if (!payload?.success) {
        setErrorMessage(t(`errors.${payload?.messageKey ?? 'TEST_ENROLLMENT_FAILED'}`));
        return;
      }
      await refetch();
      router.push(coursePath);
    } catch {
      setErrorMessage(t('errors.TEST_ENROLLMENT_FAILED'));
    }
  }, [createTestEnrollment, courseId, coursePath, refetch, router, t]);

  const handleRemove = useCallback(async () => {
    setConfirming(null);
    try {
      const result = await removeTestEnrollment({ variables: { courseId } });
      const payload = result.data?.removeTestEnrollment;
      if (!payload?.success) {
        setErrorMessage(t(`errors.${payload?.messageKey ?? 'TEST_ENROLLMENT_FAILED'}`));
        return;
      }
      await refetch();
    } catch {
      setErrorMessage(t('errors.TEST_ENROLLMENT_FAILED'));
    }
  }, [removeTestEnrollment, courseId, refetch, t]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {hasPreview ? (
        <>
          <Button as="link" href={coursePath} filled inverted>
            {t('open')}
          </Button>
          <Button onClick={() => setConfirming('remove')} disabled={removing} inverted>
            {t('end')}
          </Button>
        </>
      ) : (
        <Button onClick={() => setConfirming('create')} disabled={creating} filled inverted>
          {t('start')}
        </Button>
      )}

      <QuestionConfirmationDialog
        open={confirming !== null}
        title={confirming === 'remove' ? t('end_dialog_title') : t('start_dialog_title')}
        question={confirming === 'remove' ? t('end_dialog_question') : t('start_dialog_question')}
        confirmationText={confirming === 'remove' ? t('end') : t('start')}
        onClose={() => setConfirming(null)}
        onCancel={() => setConfirming(null)}
        onConfirm={confirming === 'remove' ? handleRemove : handleCreate}
      />

      <ErrorMessageDialog open={errorMessage !== ''} errorMessage={errorMessage} onClose={() => setErrorMessage('')} />
    </div>
  );
};
