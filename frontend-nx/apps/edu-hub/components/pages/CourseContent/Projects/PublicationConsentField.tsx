import { FC } from 'react';
import { useTranslations } from 'next-intl';
import CheckboxSelector from '../../../inputs/CheckboxSelector';

interface PublicationConsentFieldProps {
  checked: boolean;
  onChange: (granted: boolean) => void;
  /** Solo submitter vs. team — selects the consent checkbox label. */
  variant: 'solo' | 'team';
  disabled?: boolean;
  className?: string;
}

/**
 * Publication-consent control shared by the project panel and the submit dialog:
 * an opt-in checkbox plus a collapsible explanation of what gets published.
 * Purely presentational — callers own how the value is stored.
 */
const PublicationConsentField: FC<PublicationConsentFieldProps> = ({
  checked,
  onChange,
  variant,
  disabled = false,
  className = '',
}) => {
  const t = useTranslations('course');
  const checkboxLabelKey =
    variant === 'team'
      ? 'projects.publication_consent.checkbox_label_team'
      : 'projects.publication_consent.checkbox_label_solo';

  return (
    <div className={className}>
      <CheckboxSelector
        variant="material"
        suppressFeedback
        checked={checked}
        disabled={disabled}
        onValueUpdated={(granted: boolean) => onChange(granted)}
        label={t(checkboxLabelKey)}
        className="w-full"
      />
      <details className="text-xs text-label-secondary mt-1">
        <summary className="cursor-pointer text-brand hover:underline min-h-[44px] flex items-center touch-manipulation">
          {t('projects.publication_consent.details_summary')}
        </summary>
        <p className="mt-1">{t('projects.publication_consent.description')}</p>
      </details>
    </div>
  );
};

export default PublicationConsentField;
