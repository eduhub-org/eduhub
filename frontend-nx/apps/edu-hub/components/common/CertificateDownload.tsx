import React, { FC, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';
import { useRoleQuery } from '../../hooks/authedQuery';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../queries/__generated__/CourseWithEnrollment';
import { GET_SIGNED_URL } from '../../queries/actions';
import { GetSignedUrl, GetSignedUrlVariables } from '../../queries/__generated__/GetSignedUrl';
import { Button } from './Button';
import { ExtendedDegreeParticipantsEnrollment } from '../pages/ManageCourseContent/DegreeParticipationsTab';
import { ErrorMessageDialog } from '../../components/common/dialogs/ErrorMessageDialog';

interface IProps {
  courseEnrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments | ExtendedDegreeParticipantsEnrollment;
  manageView?: boolean;
  refetchAchievementCertificates?: boolean;
  refetchAttendanceCertificates?: boolean;
  setRefetchAchievementCertificates?: Dispatch<SetStateAction<boolean>>;
  setRefetchAttendanceCertificates?: Dispatch<SetStateAction<boolean>>;
  hideAchievementCertificateButton?: boolean;
  hideAttendanceCertificateButton?: boolean;
}

export const CertificateDownload: FC<IProps> = ({
  courseEnrollment,
  hideAchievementCertificateButton = false,
  hideAttendanceCertificateButton = false,
  manageView,
}) => {
  console.log('=== CertificateDownload Component State ===', {
    enrollmentId: courseEnrollment?.id,
    achievementCertificateURL: courseEnrollment?.achievementCertificateURL,
    attendanceCertificateURL: courseEnrollment?.attendanceCertificateURL,
    hideAchievementButton: hideAchievementCertificateButton,
    hideAttendanceButton: hideAttendanceCertificateButton
  });

  const t = useTranslations();
  const [errorMessage, setErrorMessage] = useState('');

  const handleQueryError = (error: string) => {
    console.error('Certificate Query Error:', error);
    setErrorMessage(error);
  };

  const { data: loadAchievementCertificateData, loading: loadAchievementCertificateLoading } = useRoleQuery<
    GetSignedUrl,
    GetSignedUrlVariables
  >(GET_SIGNED_URL, {
    variables: {
      path: courseEnrollment?.achievementCertificateURL,
    },
    skip: !courseEnrollment?.achievementCertificateURL,
    onError: () => handleQueryError(t('errorMessages:loadAchievementCertificateError')),
    onCompleted: (data) => {
      console.log('Achievement Certificate Query Completed:', {
        url: data?.getSignedUrl?.link,
        hasData: !!data
      });
    }
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
    onCompleted: (data) => {
      console.log('Attendance Certificate Query Completed:', {
        url: data?.getSignedUrl?.link,
        hasData: !!data
      });
    }
  });

  useEffect(() => {
    console.log('Certificate URLs Updated:', {
      achievement: courseEnrollment?.achievementCertificateURL,
      attendance: courseEnrollment?.attendanceCertificateURL
    });
  }, [courseEnrollment?.achievementCertificateURL, courseEnrollment?.attendanceCertificateURL]);
  return (
    <div className={!manageView ? 'mt-4' : ''}>
      <div className={`flex gap-4 ${!manageView ? 'flex-col sm:px-24' : ''}`}>
        {loadAchievementCertificateData && !loadAchievementCertificateLoading && !hideAchievementCertificateButton && (
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
        {loadAttendanceCertificateData && !loadAttendanceCertificateLoading && !hideAttendanceCertificateButton && (
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
