import React, { FC, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLazyRoleQuery } from '../../hooks/authedQuery';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../queries/__generated__/CourseWithEnrollment';
import { GET_SIGNED_URL } from '../../queries/actions';
import { GetSignedUrl, GetSignedUrlVariables } from '../../queries/__generated__/GetSignedUrl';
import { Button } from './Button';
import { ExtendedDegreeParticipantsEnrollment } from '../pages/ManageCourseContent/DegreeParticipationsTab';
import { ErrorMessageDialog } from '../../components/common/dialogs/ErrorMessageDialog';
import { CircularProgress } from '@mui/material';

interface IProps {
  courseEnrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments | ExtendedDegreeParticipantsEnrollment;
  manageView?: boolean;
}

export const CertificateDownload: FC<IProps> = ({
  courseEnrollment,
  manageView,
}) => {
  const t = useTranslations();
  const tCert = useTranslations('certificates');
  const [errorMessage, setErrorMessage] = useState('');

  const [getAchievementUrl, { loading: achievementLoading }] = useLazyRoleQuery<
    GetSignedUrl,
    GetSignedUrlVariables
  >(GET_SIGNED_URL, { fetchPolicy: 'network-only' });

  const [getAttendanceUrl, { loading: attendanceLoading }] = useLazyRoleQuery<
    GetSignedUrl,
    GetSignedUrlVariables
  >(GET_SIGNED_URL, { fetchPolicy: 'network-only' });

  const handleAchievementDownload = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    const path = courseEnrollment?.achievementCertificateURL;
    if (!path) return;

    try {
      const result = await getAchievementUrl({ variables: { path } });
      const link = result.data?.getSignedUrl?.link;
      if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        setErrorMessage(tCert('errorMessages.certificate_download_error'));
      }
    } catch {
      setErrorMessage(tCert('errorMessages.certificate_download_error'));
    }
  }, [courseEnrollment?.achievementCertificateURL, getAchievementUrl, tCert]);

  const handleAttendanceDownload = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    const path = courseEnrollment?.attendanceCertificateURL;
    if (!path) return;

    try {
      const result = await getAttendanceUrl({ variables: { path } });
      const link = result.data?.getSignedUrl?.link;
      if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        setErrorMessage(tCert('errorMessages.certificate_download_error'));
      }
    } catch {
      setErrorMessage(tCert('errorMessages.certificate_download_error'));
    }
  }, [courseEnrollment?.attendanceCertificateURL, getAttendanceUrl, tCert]);

  const hasAchievement = !!courseEnrollment?.achievementCertificateURL;
  const hasAttendance = !!courseEnrollment?.attendanceCertificateURL;

  return (
    <div className={!manageView ? 'mt-4' : ''}>
      <div
        className={`flex flex-wrap gap-4 min-w-0 items-center ${!manageView ? 'flex-col w-full' : ''}`}
      >
        {hasAchievement && (
          <>
            {!manageView && <h3 className="text-3xl font-medium text-center w-full">{t('coursePage.congrats_completion')}</h3>}
            <Button
              as="button"
              type="button"
              filled
              className={`flex justify-center items-center ${!manageView ? 'w-full' : ''}`}
              disabled={achievementLoading}
              onClick={handleAchievementDownload}
            >
              {achievementLoading ? (
                <CircularProgress size={20} />
              ) : (
                manageView
                  ? t('manageCourse.achievement_certificate_download')
                  : t('coursePage.achievementCertificateDownload')
              )}
            </Button>
          </>
        )}
        {hasAttendance && (
          <Button
            as="button"
            type="button"
            filled
            className={`flex justify-center items-center ${!manageView ? 'w-full' : ''}`}
            disabled={attendanceLoading}
            onClick={handleAttendanceDownload}
          >
            {attendanceLoading ? (
              <CircularProgress size={20} />
            ) : (
              manageView
                ? t('manageCourse.attendance_certificate_download')
                : t('coursePage.attendanceCertificateDownload')
            )}
          </Button>
        )}
        {errorMessage && (
          <ErrorMessageDialog errorMessage={errorMessage} open={!!errorMessage} onClose={() => setErrorMessage('')} />
        )}
      </div>
    </div>
  );
};
