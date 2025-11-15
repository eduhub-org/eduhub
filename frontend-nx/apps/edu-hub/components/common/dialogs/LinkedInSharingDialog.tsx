import React, { useState, useEffect } from 'react';
import { BaseDialog } from './BaseDialog';
import useTranslation from 'next-translate/useTranslation';

interface LinkedInSharingDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedType: 'achievement' | 'attendance') => void;
  onCancel?: () => void;
  hasAchievement: boolean;
  hasAttendance: boolean;
}

export const LinkedInSharingDialog: React.FC<LinkedInSharingDialogProps> = ({
  open,
  onClose,
  onConfirm,
  onCancel,
  hasAchievement,
  hasAttendance,
}) => {
  const { t: tCertificates } = useTranslation('certificates');
  const { t: tCommon } = useTranslation('common');
  
  // Single selection - default to achievement if available, otherwise attendance
  const [selectedType, setSelectedType] = useState<'achievement' | 'attendance' | null>(null);

  useEffect(() => {
    // Reset selection when dialog opens - default to achievement if available, otherwise attendance
    if (open) {
      if (hasAchievement) {
        setSelectedType('achievement');
      } else if (hasAttendance) {
        setSelectedType('attendance');
      }
    }
  }, [open, hasAchievement, hasAttendance]);

  const handleRadioChange = (type: 'achievement' | 'attendance') => {
    setSelectedType(type);
  };

  const handleConfirm = () => {
    if (selectedType) {
      onConfirm(selectedType);
    }
  };

  const showSelection = hasAchievement && hasAttendance;

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmText={tCertificates('make_public_confirm')}
      onCancel={onCancel}
      cancelText={tCommon('cancel')}
    >
      <div className="flex flex-col gap-4">
        <p>{tCertificates('linkedin_sharing_warning')}</p>
        
        {showSelection && (
          <div className="flex flex-col gap-3 mt-2">
            <p className="text-sm font-medium">{tCertificates('select_certificate_to_share')}</p>
            <div className="flex flex-col gap-2">
              {hasAchievement && (
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="certificate-type"
                    value="achievement"
                    checked={selectedType === 'achievement'}
                    onChange={() => handleRadioChange('achievement')}
                    className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{tCertificates('achievement_certificate')}</span>
                </label>
              )}
              {hasAttendance && (
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="certificate-type"
                    value="attendance"
                    checked={selectedType === 'attendance'}
                    onChange={() => handleRadioChange('attendance')}
                    className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{tCertificates('attendance_certificate')}</span>
                </label>
              )}
            </div>
          </div>
        )}
      </div>
    </BaseDialog>
  );
};

