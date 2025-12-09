import React, { FC, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { GetApp } from '@mui/icons-material';
import { TileBase } from './TileSlider/TileBase';
import { useRoleQuery } from '../../hooks/authedQuery';
import { useRoleMutation } from '../../hooks/authedMutation';
import { GET_SIGNED_URL, MAKE_CERTIFICATE_PUBLIC } from '../../queries/actions';
import { GetSignedUrl, GetSignedUrlVariables } from '../../queries/__generated__/GetSignedUrl';
import { MakeCertificatePublic, MakeCertificatePublicVariables } from '../../queries/__generated__/MakeCertificatePublic';
import { Button } from './Button';
import { LinkedInSharingDialog } from './dialogs/LinkedInSharingDialog';
import { ErrorMessageDialog } from './dialogs/ErrorMessageDialog';
import { MyCertificates_CourseEnrollment } from '../../queries/__generated__/MyCertificates';

interface CertificateTileProps {
  enrollment: MyCertificates_CourseEnrollment;
}

export const CertificateTile: FC<CertificateTileProps> = ({ enrollment }) => {
  const t = useTranslations('certificates');
  const tCommon = useTranslations('common');
  const [linkedInDialogOpen, setLinkedInDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const course = enrollment.Course;
  const program = course?.Program;

  // Query for achievement certificate URL
  const { data: achievementData, loading: achievementLoading } = useRoleQuery<
    GetSignedUrl,
    GetSignedUrlVariables
  >(GET_SIGNED_URL, {
    variables: {
      path: enrollment.achievementCertificateURL || '',
    },
    skip: !enrollment.achievementCertificateURL,
  });

  // Query for attendance certificate URL
  const { data: attendanceData, loading: attendanceLoading } = useRoleQuery<
    GetSignedUrl,
    GetSignedUrlVariables
  >(GET_SIGNED_URL, {
    variables: {
      path: enrollment.attendanceCertificateURL || '',
    },
    skip: !enrollment.attendanceCertificateURL,
  });

  // Mutation for making certificate public
  const [makeCertificatePublic, { loading: makingPublic }] = useRoleMutation<MakeCertificatePublic, MakeCertificatePublicVariables>(
    MAKE_CERTIFICATE_PUBLIC
  );

  const handleCertificateClick = (type: 'achievement' | 'attendance') => {
    const url = type === 'achievement' 
      ? achievementData?.getSignedUrl?.link 
      : attendanceData?.getSignedUrl?.link;
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

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

  const hasAchievement = !!enrollment.achievementCertificateURL;
  const hasAttendance = !!enrollment.attendanceCertificateURL;
  const hasAnyCertificate = hasAchievement || hasAttendance;

  return (
    <>
      <TileBase
        coverImage={course?.coverImage || null}
        title={course?.title || ''}
      >
        <div className="flex flex-col h-full justify-between">
          <div className="flex flex-col gap-3">
            {/* Download Certificate Buttons */}
            {hasAchievement && (
              <Button
                filled
                onClick={() => handleCertificateClick('achievement')}
                disabled={achievementLoading}
                className="flex items-center justify-center gap-2 text-sm py-2 px-3"
              >
                <GetApp fontSize="small" />
                {t('achievement_certificate')}
              </Button>
            )}
            {hasAttendance && (
              <Button
                filled
                onClick={() => handleCertificateClick('attendance')}
                disabled={attendanceLoading}
                className="flex items-center justify-center gap-2 text-sm py-2 px-3"
              >
                <GetApp fontSize="small" />
                {t('attendance_certificate')}
              </Button>
            )}

            {/* Single LinkedIn Share Button */}
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

          {/* Program Title at bottom */}
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
