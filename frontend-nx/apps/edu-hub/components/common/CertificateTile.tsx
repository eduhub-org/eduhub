import React, { FC, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { School as SchoolIcon, Event as EventIcon } from '@mui/icons-material';
import { TileBase } from './TileSlider/TileBase';
import { useRoleQuery, useLazyRoleQuery } from '../../hooks/authedQuery';
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
  const { t } = useTranslation('certificates');
  const [linkedInDialogOpen, setLinkedInDialogOpen] = useState(false);
  const [selectedCertificateType, setSelectedCertificateType] = useState<'achievement' | 'attendance' | null>(null);
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

  // Lazy query for making certificate public
  const [makeCertificatePublic, { loading: makingPublic }] = useLazyRoleQuery<
    MakeCertificatePublic,
    MakeCertificatePublicVariables
  >(MAKE_CERTIFICATE_PUBLIC);

  const handleCertificateClick = (type: 'achievement' | 'attendance') => {
    const url = type === 'achievement' 
      ? achievementData?.getSignedUrl?.link 
      : attendanceData?.getSignedUrl?.link;
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLinkedInClick = (type: 'achievement' | 'attendance') => {
    setSelectedCertificateType(type);
    setLinkedInDialogOpen(true);
  };

  const handleLinkedInConfirm = async () => {
    if (!selectedCertificateType) return;

    const certificatePath = selectedCertificateType === 'achievement'
      ? enrollment.achievementCertificateURL
      : enrollment.attendanceCertificateURL;

    if (!certificatePath) {
      setErrorMessage(t('errorMessages:certificate_not_found', {}, { fallback: 'Certificate not found' }));
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
        setErrorMessage(result?.data?.makeCertificatePublic?.error || t('errorMessages:linkedin_share_error', {}, { fallback: 'Failed to share certificate on LinkedIn' }));
      }
    } catch (error) {
      setErrorMessage(t('errorMessages:linkedin_share_error', {}, { fallback: 'Failed to share certificate on LinkedIn' }));
    } finally {
      setLinkedInDialogOpen(false);
      setSelectedCertificateType(null);
    }
  };

  const hasAchievement = !!enrollment.achievementCertificateURL;
  const hasAttendance = !!enrollment.attendanceCertificateURL;

  return (
    <>
      <TileBase
        coverImage={course?.coverImage || null}
        title={course?.title || ''}
      >
        <div className="flex flex-col h-full justify-between">
          <div className="flex flex-col gap-3">
            {/* Certificate Icons */}
            <div className="flex gap-4 items-center">
              {hasAchievement && (
                <button
                  onClick={() => handleCertificateClick('achievement')}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title={t('achievement_certificate')}
                  disabled={achievementLoading}
                >
                  <SchoolIcon className="text-edu-black" fontSize="large" />
                </button>
              )}
              {hasAttendance && (
                <button
                  onClick={() => handleCertificateClick('attendance')}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title={t('attendance_certificate')}
                  disabled={attendanceLoading}
                >
                  <EventIcon className="text-edu-black" fontSize="large" />
                </button>
              )}
            </div>

            {/* LinkedIn Share Buttons */}
            {hasAchievement && (
              <Button
                filled
                onClick={() => handleLinkedInClick('achievement')}
                disabled={makingPublic}
                className="text-sm"
              >
                {t('share_on_linkedin')} - {t('achievement_certificate')}
              </Button>
            )}
            {hasAttendance && (
              <Button
                filled
                onClick={() => handleLinkedInClick('attendance')}
                disabled={makingPublic}
                className="text-sm"
              >
                {t('share_on_linkedin')} - {t('attendance_certificate')}
              </Button>
            )}
          </div>

          {/* Program Title at bottom */}
          {program && (
            <div className="text-xs tracking-wider mt-auto">
              {!program.published && program.title}
            </div>
          )}
        </div>
      </TileBase>

      <LinkedInSharingDialog
        open={linkedInDialogOpen}
        onClose={() => {
          setLinkedInDialogOpen(false);
          setSelectedCertificateType(null);
        }}
        onConfirm={handleLinkedInConfirm}
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
