import { FC } from 'react';
import { useTranslations } from 'next-intl';

/** A program name shown to org admins who may not rename the program. */
const ReadOnlyProgramField: FC<{ label: string; value: string | null }> = ({ label, value }) => {
  const t = useTranslations('managePrograms');
  return (
    <div className="min-w-0">
      <span className="block text-xs text-label-secondary mb-1">{label}</span>
      <p className="text-sm text-label-primary truncate">{value || '–'}</p>
      <p className="text-xs text-label-secondary mt-1">{t('rename_requires_settings')}</p>
    </div>
  );
};

export default ReadOnlyProgramField;
