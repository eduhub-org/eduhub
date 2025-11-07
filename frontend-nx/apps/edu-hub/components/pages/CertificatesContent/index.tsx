import { FC } from 'react';
import { useSession } from 'next-auth/react';
import useTranslation from 'next-translate/useTranslation';
import { CircularProgress } from '@mui/material';
import Link from 'next/link';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { MY_CERTIFICATES } from '../../../queries/myCertificates';
import { MyCertificates, MyCertificatesVariables } from '../../../queries/__generated__/MyCertificates';
import { CertificateTile } from '../../common/CertificateTile';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { Button } from '../../common/Button';
import { useState } from 'react';

const CertificatesContent: FC = () => {
  const { t } = useTranslation('certificates');
  const { data: sessionData, status: sessionStatus } = useSession();
  const [showError, setShowError] = useState(true);

  const {
    data: certificatesData,
    loading,
    error,
  } = useRoleQuery<MyCertificates, MyCertificatesVariables>(MY_CERTIFICATES, {
    variables: {
      userId: sessionData?.profile?.sub || '',
    },
    skip: !sessionData?.profile?.sub || sessionStatus === 'loading',
  });

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-[77vh]">
        <CircularProgress />
      </div>
    );
  }

  if (!sessionData?.profile?.sub) {
    return <div>{t('not_authenticated', {}, { fallback: 'Not authenticated' })}</div>;
  }

  if (error) {
    return (
      <ErrorMessageDialog
        errorMessage={error.message}
        open={showError}
        onClose={() => setShowError(false)}
      />
    );
  }

  const enrollments = certificatesData?.CourseEnrollment || [];

  if (enrollments.length === 0) {
    return (
      <div className="px-3 mt-20 max-w-screen-xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="max-w-2xl">
            <p className="text-xl mb-4 text-gray-700">{t('no_certificates_title')}</p>
            <p className="text-lg mb-8 text-gray-600">{t('no_certificates_description')}</p>
            <Link href="/">
              <Button filled className="text-lg px-8 py-3">
                {t('browse_courses')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 mt-20 max-w-screen-xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {enrollments.map((enrollment) => (
          <CertificateTile key={enrollment.id} enrollment={enrollment} />
        ))}
      </div>
    </div>
  );
};

export default CertificatesContent;

