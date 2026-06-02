import React, { FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import { GetApp } from '@mui/icons-material';
import { TileBase } from './TileSlider/TileBase';
import { useRoleMutation } from '../../hooks/authedMutation';
import { MAKE_CERTIFICATE_PUBLIC } from '../../queries/actions';
import { MakeCertificatePublic, MakeCertificatePublicVariables } from '../../queries/__generated__/MakeCertificatePublic';
import { Button } from './Button';
import { LinkedInSharingDialog } from './dialogs/LinkedInSharingDialog';
import { ErrorMessageDialog } from './dialogs/ErrorMessageDialog';
import { MyCertificates_CourseEnrollment } from '../../queries/__generated__/MyCertificates';
import { getCertificateDownloadUrl } from '../../helpers/certificateDownload';

interface CertificateTileProps {
  enrollment: MyCertificates_CourseEnrollment;
}

export const CertificateTile: FC<CertificateTileProps> = ({ enrollment }) => {
  const t = useTranslations('certificates');
  const [linkedInDialogOpen, setLinkedInDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const course = enrollment.Course;
  const program = course?.Program;

  const [makeCertificatePublic, { loading: makingPublic }] = useRoleMutation<MakeCertificatePublic, MakeCertificatePublicVariables>(
    MAKE_CERTIFICATE_PUBLIC
  );

  const handleLinkedInClick = () => {
    setLinkedInDialogOpen(true);
  };

  const handleLinkedInConfirm = async (selectedType: 'achievement' | 'attendance') => {
    const certificatePath = selectedType === 'achievement'
      ? enrollment.achievementCertificateURL
      : enrollment.attendanceCertificateURL;

    if (!certificatePath) {
      setErrorMessage(t('errorMessages.certificate_not_found'));
      setLinkedInDialogOpen(false);
      return;
    }

    try {
      const result = await makeCertificatePublic({
        variables: { certificatePath },
      });

      if (result?.data?.makeCertificatePublic?.success && result?.data?.makeCertificatePublic?.publicUrl) {
        const publicUrl = result.data.makeCertificatePublic.publicUrl;
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`;
        window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
      } else {
        setErrorMessage(result?.data?.makeCertificatePublic?.error || t('errorMessages.linkedin_share_error'));
      }
    } catch (error: any) {
      console.error('LinkedIn share error:', error);
      setErrorMessage(error?.message || t('errorMessages.linkedin_share_error'));
    } finally {
      setLinkedInDialogOpen(false);
    }
  };

  const achievementCertificatePath = enrollment.achievementCertificateURL;
  const attendanceCertificatePath = enrollment.attendanceCertificateURL;
  const hasAchievement = !!achievementCertificatePath;
  const hasAttendance = !!attendanceCertificatePath;
  const hasAnyCertificate = hasAchievement || hasAttendance;

  return (
    <>
      <TileBase
        coverImage={course?.coverImage || null}
        title={course?.title || ''}
      >
        <div className="flex flex-col h-full justify-between">
          <div className="flex flex-col gap-3">
            {achievementCertificatePath && (
              <Button
                as="a"
                href={getCertificateDownloadUrl(achievementCertificatePath)}
                target="_blank"
                rel="noopener noreferrer"
                filled
                className="flex items-center justify-center gap-2 text-sm py-2 px-3"
              >
                <GetApp fontSize="small" />
                {t('achievement_certificate')}
              </Button>
            )}
            {attendanceCertificatePath && (
              <Button
                as="a"
                href={getCertificateDownloadUrl(attendanceCertificatePath)}
                target="_blank"
                rel="noopener noreferrer"
                filled
                className="flex items-center justify-center gap-2 text-sm py-2 px-3"
              >
                <GetApp fontSize="small" />
                {t('attendance_certificate')}
              </Button>
            )}

            {hasAnyCertificate && (
              <Button
                onClick={handleLinkedInClick}
                disabled={makingPublic}
                className="text-xs py-1 px-2"
              >
                {t('share_on_linkedin')}
              </Button>
            )}
          </div>

          {program && program.title && (
            <div className="text-xs tracking-wider mt-auto text-right">
              {program.title}
            </div>
          )}
        </div>
      </TileBase>

      <LinkedInSharingDialog
        open={linkedInDialogOpen}
        onClose={() => {
          setLinkedInDialogOpen(false);
        }}
        onConfirm={handleLinkedInConfirm}
        hasAchievement={hasAchievement}
        hasAttendance={hasAttendance}
      />

      {errorMessage && (
        <ErrorMessageDialog
          errorMessage={errorMessage}
          open={!!errorMessage}
          onClose={() => setErrorMessage('')}
        />
      )}
    </>
  );
};
