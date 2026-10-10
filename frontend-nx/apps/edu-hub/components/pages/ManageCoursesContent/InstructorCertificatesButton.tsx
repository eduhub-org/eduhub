import { FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CircularProgress } from '@mui/material';

import { useManageMutation } from '../../../hooks/authedMutation';
import { CREATE_INSTRUCTOR_CERTIFICATES } from '../../../queries/instructorPayment';
import {
  CreateInstructorCertificates,
  CreateInstructorCertificatesVariables,
} from '../../../queries/__generated__/CreateInstructorCertificates';

type Result = CreateInstructorCertificates['createInstructorCertificates'];

/** Message for a createInstructorCertificates result, shared by the row button and the bulk action. */
export const instructorCertificatesResultMessage = (
  t: ReturnType<typeof useTranslations>,
  result: Result | null | undefined
): { ok: boolean; message: string } => {
  if (!result?.success) return { ok: false, message: t('instructor_certificates.failed') };
  const skipped = result.skippedCourseIds?.length ?? 0;
  const generated = t('instructor_certificates.generated', { count: result.count ?? 0 });
  return {
    ok: skipped === 0,
    message: skipped ? `${generated} ${t('instructor_certificates.skipped', { count: skipped })}` : generated,
  };
};

export const useCreateInstructorCertificates = () =>
  useManageMutation<CreateInstructorCertificates, CreateInstructorCertificatesVariables>(
    CREATE_INSTRUCTOR_CERTIFICATES,
    { refetchQueries: ['AdminCourseList'] }
  );

const InstructorCertificatesButton: FC<{ courseId: number }> = ({ courseId }) => {
  const t = useTranslations('manageCourses');
  const [createCertificates, { loading }] = useCreateInstructorCertificates();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const handleClick = async () => {
    try {
      const { data } = await createCertificates({ variables: { courseIds: [courseId] } });
      setFeedback(instructorCertificatesResultMessage(t, data?.createInstructorCertificates));
    } catch {
      setFeedback({ ok: false, message: t('instructor_certificates.failed') });
    }
  };

  return (
    <div className="mt-4 border-t border-border-primary pt-4 space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
      >
        {loading ? <CircularProgress size={14} /> : null}
        {t('instructor_certificates.generate')}
      </button>
      {feedback ? (
        <p className={`text-xs ${feedback.ok ? 'text-label-secondary' : 'text-error'}`}>{feedback.message}</p>
      ) : null}
    </div>
  );
};

export default InstructorCertificatesButton;
