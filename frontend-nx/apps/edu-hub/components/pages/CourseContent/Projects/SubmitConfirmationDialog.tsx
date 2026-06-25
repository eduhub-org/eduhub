import { FC, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DialogShell } from '../../../common/dialogs/DialogShell';
import { Button } from '../../../common/Button';
import CheckboxSelector from '../../../inputs/CheckboxSelector';
import PublicationConsentField from './PublicationConsentField';

export interface SubmitAuthorOption {
  /** ProjectAuthor.id */
  id: number;
  userId: string;
  name: string;
  /** The submitting author themselves — always counts as a contributor. */
  isSelf: boolean;
}

interface SubmitConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  /** Receives the ProjectAuthor ids the submitter unchecked (to be EXCLUDED) and whether publication consent was granted. */
  onConfirm: (excludedAuthorIds: number[], consentGranted: boolean) => void;
  loading?: boolean;
  authors: SubmitAuthorOption[];
  /** Online-course projects do not offer publication consent. */
  showPublicationConsent?: boolean;
}

const SubmitConfirmationDialog: FC<SubmitConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading,
  authors,
  showPublicationConsent = true,
}) => {
  const t = useTranslations('course');
  const tCommon = useTranslations('common');

  // Default: everyone checked (contributed). Keyed by ProjectAuthor.id.
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  // Publication consent is opt-in (GDPR requires affirmative consent — unchecked by default).
  const [consentGranted, setConsentGranted] = useState(false);

  useEffect(() => {
    if (open) {
      setChecked(Object.fromEntries(authors.map((a) => [a.id, true])));
      setConsentGranted(false);
    }
  }, [open, authors]);

  const handleConfirm = () => {
    const excludedAuthorIds = authors
      .filter((a) => !a.isSelf && checked[a.id] === false)
      .map((a) => a.id);
    onConfirm(excludedAuthorIds, showPublicationConsent ? consentGranted : false);
  };

  const consentVariant = authors.length <= 1 ? 'solo' : 'team';

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={t('projects.submit_dialog.title')}
      ariaLabelledBy="submit-project-dialog"
      maxWidth="sm"
      actions={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={loading}>
            {tCommon('cancel')}
          </Button>
          <Button filled onClick={handleConfirm} disabled={loading}>
            {t('projects.submit_dialog.confirm_button')}
          </Button>
        </div>
      }
    >
      <p className="mb-2">{t('projects.submit_dialog.body_main')}</p>
      <p className="mb-3 text-sm text-label-secondary">
        {t('projects.submit_dialog.contributors_intro')}
      </p>
      <ul className="list-none p-0 m-0 mb-3 space-y-1">
        {authors.map((author) => (
          <li key={author.id}>
            <CheckboxSelector
              variant="material"
              suppressFeedback
              checked={checked[author.id] ?? true}
              disabled={author.isSelf || loading}
              onValueUpdated={(newChecked) => {
                setChecked((prev) => ({ ...prev, [author.id]: newChecked }));
              }}
              label={
                author.isSelf
                  ? `${author.name} ${t('projects.submit_dialog.contributor_self_suffix')}`
                  : author.name
              }
            />
          </li>
        ))}
      </ul>
      <p className="mb-4 text-sm text-label-secondary">
        {t('projects.submit_dialog.body_irreversible')}
      </p>

      {showPublicationConsent ? (
      <div className="rounded border border-border-primary bg-bg-secondary/30 p-3 space-y-2">
        <p className="text-sm font-semibold text-label-primary">
          {t('projects.publication_consent.heading')}
        </p>
        <PublicationConsentField
          checked={consentGranted}
          onChange={setConsentGranted}
          variant={consentVariant}
          disabled={loading}
        />
      </div>
      ) : null}
    </DialogShell>
  );
};

export default SubmitConfirmationDialog;
