import { FC, useEffect, useState } from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';
import { useTranslations } from 'next-intl';
import { DialogShell } from '../../../common/dialogs/DialogShell';
import { Button } from '../../../common/Button';

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
  /** Receives the ProjectAuthor ids the submitter unchecked (to be EXCLUDED). */
  onConfirm: (excludedAuthorIds: number[]) => void;
  loading?: boolean;
  authors: SubmitAuthorOption[];
}

const SubmitConfirmationDialog: FC<SubmitConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading,
  authors,
}) => {
  const t = useTranslations('course');
  const tCommon = useTranslations('common');

  // Default: everyone checked (contributed). Keyed by ProjectAuthor.id.
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (open) {
      setChecked(Object.fromEntries(authors.map((a) => [a.id, true])));
    }
  }, [open, authors]);

  const handleToggle = (id: number) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleConfirm = () => {
    const excludedAuthorIds = authors
      .filter((a) => !a.isSelf && checked[a.id] === false)
      .map((a) => a.id);
    onConfirm(excludedAuthorIds);
  };

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
            <FormControlLabel
              control={
                <Checkbox
                  checked={checked[author.id] ?? true}
                  disabled={author.isSelf || loading}
                  onChange={() => handleToggle(author.id)}
                  color="primary"
                />
              }
              label={
                <span>
                  {author.name}
                  {author.isSelf ? (
                    <span className="ml-1 text-xs text-label-secondary">
                      {t('projects.submit_dialog.contributor_self_suffix')}
                    </span>
                  ) : null}
                </span>
              }
            />
          </li>
        ))}
      </ul>
      <p className="mb-2 text-sm text-label-secondary">
        {t('projects.submit_dialog.contributors_hint')}
      </p>
      <p className="text-sm text-label-secondary">
        {t('projects.submit_dialog.body_irreversible')}
      </p>
    </DialogShell>
  );
};

export default SubmitConfirmationDialog;
