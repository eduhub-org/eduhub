import React, { FC } from 'react';
import { useTranslations } from 'next-intl';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../queries/__generated__/CourseWithEnrollment';
import { Button } from './Button';
import { ExtendedDegreeParticipantsEnrollment } from '../pages/ManageCourseContent/DegreeParticipationsTab';
import { getCertificateDownloadUrl } from '../../helpers/certificateDownload';

interface IProps {
  courseEnrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments | ExtendedDegreeParticipantsEnrollment;
  manageView?: boolean;
}

export const CertificateDownload: FC<IProps> = ({
  courseEnrollment,
  manageView,
}) => {
  const t = useTranslations();
  const achievementCertificatePath = courseEnrollment?.achievementCertificateURL;
  const attendanceCertificatePath = courseEnrollment?.attendanceCertificateURL;

  return (
    <div className={!manageView ? 'mt-4' : ''}>
      <div
        className={`flex flex-wrap gap-4 min-w-0 items-center ${!manageView ? 'flex-col w-full' : ''}`}
      >
        {achievementCertificatePath && (
          <>
            {!manageView && <h3 className="text-3xl font-medium text-center w-full">{t('coursePage.congrats_completion')}</h3>}
            <Button
              as="a"
              href={getCertificateDownloadUrl(achievementCertificatePath)}
              target="_blank"
              rel="noopener noreferrer"
              filled
              className={`flex justify-center items-center ${!manageView ? 'w-full' : ''}`}
            >
              {manageView
                ? t('manageCourse.achievement_certificate_download')
                : t('coursePage.achievementCertificateDownload')}
            </Button>
          </>
        )}
        {attendanceCertificatePath && (
          <Button
            as="a"
            href={getCertificateDownloadUrl(attendanceCertificatePath)}
            target="_blank"
            rel="noopener noreferrer"
            filled
            className={`flex justify-center items-center ${!manageView ? 'w-full' : ''}`}
          >
            {manageView
              ? t('manageCourse.attendance_certificate_download')
              : t('coursePage.attendanceCertificateDownload')}
          </Button>
        )}
      </div>
    </div>
  );
};
