import React, { FC, useState, useEffect, ErrorInfo, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { CircularProgress } from '@mui/material';
import Link from 'next/link';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { MY_CERTIFICATES } from '../../../queries/myCertificates';
import { MyCertificates, MyCertificatesVariables } from '../../../queries/__generated__/MyCertificates';
import { CertificateTile } from '../../common/CertificateTile';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { Button } from '../../common/Button';
import { PageBlock } from '../../common/PageBlock';

class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please try again later.</h1>;
    }

    return this.props.children;
  }
}

const CertificatesContent: FC = () => {
  const t = useTranslations('certificates');
  const { data: sessionData, status: sessionStatus } = useSession();
  const [showError, setShowError] = useState(false);

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

  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-[77vh]">
        <CircularProgress />
      </div>
    );
  }

  if (!sessionData?.profile?.sub) {
    return <div>{t('not_authenticated')}</div>;
  }

  const enrollments = certificatesData?.CourseEnrollment || [];

  return (
    <>
      <PageBlock>
        <div className="max-w-screen-xl mx-auto mt-20">
          <div className="flex flex-row mb-12 text-white">
            <h1 className="text-4xl font-bold mt-24">{t('title')}</h1>
          </div>
          {enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="max-w-2xl">
                <p className="text-xl mb-4 text-white">{t('no_certificates_title')}</p>
                <p className="text-lg mb-8 text-gray-300">{t('no_certificates_description')}</p>
                <Link href="/">
                  <Button filled className="text-lg px-8 py-3">
                    {t('browse_courses')}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="w-full max-w-[325px]">
                  <CertificateTile enrollment={enrollment} />
                </div>
              ))}
            </div>
          )}
        </div>
      </PageBlock>
      {error && (
        <ErrorMessageDialog
          errorMessage={error.message}
          open={showError}
          onClose={() => setShowError(false)}
        />
      )}
    </>
  );
};

const WrappedCertificatesContent: FC = () => (
  <ErrorBoundary>
    <CertificatesContent />
  </ErrorBoundary>
);

export default WrappedCertificatesContent;

