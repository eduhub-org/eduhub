import React, { FC, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { Dispatch, SetStateAction } from 'react';

import { useRoleQuery } from '../../hooks/authedQuery';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../queries/__generated__/CourseWithEnrollment';
import { LOAD_FILE } from '../../queries/actions';
import { LoadFile, LoadFileVariables } from '../../queries/__generated__/LoadFile';
import { Button } from './Button';
import { ExtendedDegreeParticipantsEnrollment } from '../ManageCourseContent/DegreeParticipationsTab';
import { ErrorMessageDialogComponent } from '../../components/common/dialogs/ErrorMessageDialog';

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

  const {
    data: loadAchievementCertificateData,
    loading: loadAchievementCerfificateLoading,
    error: achievementCertificateError,
  } = useRoleQuery<LoadFile, LoadFileVariables>(LOAD_FILE, {
    variables: {
      path: courseEnrollment?.achievementCertificateURL,
    },
    skip: !courseEnrollment?.achievementCertificateURL,
    onError: () => handleQueryError(t('errorMessages:loadAchievementCertificateError')),
  });

  const {
    data: loadAttendanceCertificateData,
    loading: loadAttendanceCertificateLoading,
    error: attendanceCertificateError,
  } = useRoleQuery<LoadFile, LoadFileVariables>(LOAD_FILE, {
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
              href={loadAchievementCertificateData.loadFile.link}
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
            href={loadAttendanceCertificateData.loadFile.link}
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
          <ErrorMessageDialogComponent
            errorMessage={errorMessage}
            open={!!errorMessage}
            onClose={() => setErrorMessage('')}
          />
        )}
      </div>
    </div>
  );
};
