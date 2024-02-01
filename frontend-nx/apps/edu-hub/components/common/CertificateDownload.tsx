import React, { FC, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { Dispatch, SetStateAction } from 'react';

import { useRoleQuery } from '../../hooks/authedQuery';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../queries/__generated__/CourseWithEnrollment';
import { GET_SIGNED_URL } from '../../queries/actions';
import { GetSignedUrl, GetSignedUrlVariables } from '../../queries/__generated__/GetSignedUrl';
import { Button } from './Button';
import { ExtendedDegreeParticipantsEnrollment } from '../ManageCourseContent/DegreeParticipationsTab';
import { ErrorMessageDialog } from '../../components/common/dialogs/ErrorMessageDialog';

interface IProps {
  courseEnrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments | ExtendedDegreeParticipantsEnrollment;
  manageView?: boolean;
  refetchAchievementCertificates?: boolean;
  refetchAttendanceCertificates?: boolean;
  setRefetchAchievementCertificates?: Dispatch<SetStateAction<boolean>>;
  setRefetchAttendanceCertificates?: Dispatch<SetStateAction<boolean>>;
}

export const CertificateDownload: FC<IProps> = ({
  courseEnrollment,
  manageView,
  refetchAchievementCertificates,
  refetchAttendanceCertificates,
  setRefetchAchievementCertificates,
  setRefetchAttendanceCertificates,
}) => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState('');

  const handleQueryError = (error: string) => {
    setErrorMessage(error);
  };

  const { data: loadAchievementCertificateData, loading: loadAchievementCerfificateLoading } = useRoleQuery<
    GetSignedUrl,
    GetSignedUrlVariables
  >(GET_SIGNED_URL, {
    variables: {
      path: courseEnrollment?.achievementCertificateURL,
    },
    skip: !courseEnrollment?.achievementCertificateURL,
    onError: () => handleQueryError(t('errorMessages:loadAchievementCertificateError')),
  });

  const { data: loadAttendanceCertificateData, loading: loadAttendanceCertificateLoading } = useRoleQuery<
    GetSignedUrl,
    GetSignedUrlVariables
  >(GET_SIGNED_URL, {
    variables: {
      path: courseEnrollment?.attendanceCertificateURL,
    },
    skip: !courseEnrollment?.attendanceCertificateURL,
    onError: () => handleQueryError(t('errorMessages:loadAttendanceCertificateError')),
  });

  return (
    <div className={!manageView && 'mt-4'}>
      <div className={`flex gap-4 ${!manageView && 'flex-col sm:px-24'}`}>
        {loadAchievementCertificateData && !loadAchievementCerfificateLoading && (
          <>
            {!manageView && <h3 className="text-3xl font-medium">{t('course-page:congrats-completion')}</h3>}
            <Button
              as="a"
              filled
              href={loadAchievementCertificateData.getSignedUrl.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {manageView
                ? t('manageCourse:achievement_certificate_download')
                : t('course-page:achievementCertificateDownload')}
            </Button>
          </>
        )}
        {loadAttendanceCertificateData && !loadAttendanceCertificateLoading && (
          <Button
            as="a"
            filled
            href={loadAttendanceCertificateData.getSignedUrl.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {manageView
              ? t('manageCourse:attendance_certificate_download')
              : t('course-page:attendanceCertificateDownload')}
          </Button>
        )}
        {/* Error Message Dialog */}
        {errorMessage && (
          <ErrorMessageDialog errorMessage={errorMessage} open={!!errorMessage} onClose={() => setErrorMessage('')} />
        )}
      </div>
    </div>
  );
};
