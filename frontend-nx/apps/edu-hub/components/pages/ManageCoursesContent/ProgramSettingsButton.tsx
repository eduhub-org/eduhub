import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { MdSettings } from 'react-icons/md';

interface ProgramSettingsButtonProps {
  open: boolean;
  onToggle: () => void;
}

/** Opens the settings of the selected program, labelled so it is not mistaken for decoration. */
const ProgramSettingsButton: FC<ProgramSettingsButtonProps> = ({ open, onToggle }) => {
  const t = useTranslations('manageCourses');
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors ${
        open
          ? 'bg-fill-primary text-label-primary border-fill-primary hover:border-brand'
          : 'text-white border-border-secondary hover:border-brand'
      }`}
    >
      <MdSettings size={20} aria-hidden="true" />
      {t('program_settings.open')}
    </button>
  );
};

export default ProgramSettingsButton;
