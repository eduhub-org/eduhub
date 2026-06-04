import React, { FC } from 'react';
import { useTranslations } from 'next-intl';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../queries/__generated__/CourseWithEnrollment';
import { Button } from './Button';
import { ExtendedDegreeParticipantsEnrollment } from '../pages/ManageCourseContent/DegreeParticipationsTab';
import { getCertificateDownloadUrl } from '../../helpers/certificateDownload';

const MY_CERTIFICATES_PATH = '/my-certificates';

interface IProps {
  courseEnrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments | ExtendedDegreeParticipantsEnrollment;
  manageView?: boolean;
  className?: string;
}

export const CertificateDownload: FC<IProps> = ({
  courseEnrollment,
  manageView,
  className,
}) => {
  const t = useTranslations();
  const achievementCertificatePath = courseEnrollment?.achievementCertificateURL;
  const attendanceCertificatePath = courseEnrollment?.attendanceCertificateURL;
  const hasCertificate = Boolean(achievementCertificatePath || attendanceCertificatePath);
  const manageViewButtonClassName =
    'max-w-full min-w-0 whitespace-normal text-center leading-tight break-words';
  const coursePageButtonClassName = 'w-full max-w-md mx-auto lg:max-w-lg';

  if (!manageView) {
    if (!hasCertificate) {
      return null;
    }

    return (
      <div className={className ?? 'mt-4'}>
        <div className="flex flex-col gap-4 w-full items-center">
          <h3 className="text-3xl font-medium text-center w-full">{t('coursePage.congrats_completion')}</h3>
          <Button
            as="link"
            href={MY_CERTIFICATES_PATH}
            filled
            className={`flex justify-center items-center ${coursePageButtonClassName}`}
          >
            {t('coursePage.view_my_certificates')}
          </Button>
        </div>
      </div>
    );
  }

  if (!hasCertificate) {
    return null;
  }

  return (
    <div className="">
      <div className="flex flex-wrap min-w-0 items-center gap-2">
        {achievementCertificatePath && (
          <Button
            as="a"
            href={getCertificateDownloadUrl(achievementCertificatePath)}
            target="_blank"
            rel="noopener noreferrer"
            filled
            className={`flex justify-center items-center ${manageViewButtonClassName}`}
          >
            {t('manageCourse.achievement_certificate_download')}
          </Button>
        )}
        {attendanceCertificatePath && (
          <Button
            as="a"
            href={getCertificateDownloadUrl(attendanceCertificatePath)}
            target="_blank"
            rel="noopener noreferrer"
            filled
            className={`flex justify-center items-center ${manageViewButtonClassName}`}
          >
            {t('manageCourse.attendance_certificate_download')}
          </Button>
        )}
      </div>
    </div>
  );
};
