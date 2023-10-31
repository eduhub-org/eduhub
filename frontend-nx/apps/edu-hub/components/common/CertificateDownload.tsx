import useTranslation from 'next-translate/useTranslation';
import { Dispatch, FC, SetStateAction} from 'react';

import { useAuthedQuery } from '../../hooks/authedQuery';

import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../queries/__generated__/CourseWithEnrollment';
import { LOAD_ACHIEVEMENT_CERTIFICATE } from '../../queries/loadAchievementCertificate';
import { LOAD_ATTENDANCE_CERTIFICATE } from '../../queries/loadAttendanceCertificate';
import { Button } from './Button';

import {
  loadAchievementCertificate,
  loadAchievementCertificateVariables,
} from '../../queries/__generated__/loadAchievementCertificate';
import {
  loadAttendanceCertificate,
  loadAttendanceCertificateVariables,
} from '../../queries/__generated__/loadAttendanceCertificate';

interface IProps {
  courseEnrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments;
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

  const {
    data: loadAchievementCertificateData,
    loading: loadAchievementCerfificateLoading,
    //refetch: loadAchievementCerfificateRefetch,
  } = useAuthedQuery<loadAchievementCertificate, loadAchievementCertificateVariables>(LOAD_ACHIEVEMENT_CERTIFICATE, {
    variables: {
      path: courseEnrollment?.achievementCertificateURL,
    },
    skip: !courseEnrollment?.achievementCertificateURL,
  });

  const { data: loadAttendanceCertificateData, loading: loadAttendanceCertificateLoading } = useAuthedQuery<
    loadAttendanceCertificate,
    loadAttendanceCertificateVariables
  >(LOAD_ATTENDANCE_CERTIFICATE, {
    variables: {
      path: courseEnrollment?.attendanceCertificateURL,
    },
    skip: !courseEnrollment?.attendanceCertificateURL,
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
              href={loadAchievementCertificateData.loadAchievementCertificate.link}
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
            href={loadAttendanceCertificateData.loadAttendanceCertificate.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {manageView
              ? t('manageCourse:attendance_certificate_download')
              : t('course-page:attendanceCertificateDownload')}
          </Button>
        )}
      </div>
    </div>
  );
};
