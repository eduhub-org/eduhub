import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import InputField from '../../inputs/InputField';
import { useTranslations } from 'next-intl';
import { DialogShell } from './DialogShell';

interface LinkDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
  onRemove?: () => void;
  initialUrl?: string;
  hasExistingLink?: boolean;
}

export const LinkDialog: React.FC<LinkDialogProps> = ({
  open,
  onClose,
  onConfirm,
  onRemove,
  initialUrl = '',
  hasExistingLink = false,
}) => {
  const t = useTranslations('common');
  const [url, setUrl] = useState(initialUrl);

  // Reset URL when dialog opens/closes
  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
    }
  }, [open, initialUrl]);

  const handleConfirm = () => {
    onConfirm(url.trim());
    onClose();
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    onClose();
  };

  const handleCancel = () => {
    setUrl(initialUrl); // Reset to initial value
    onClose();
  };

  const actions = (
    <div className="flex justify-between">
      <div className="flex gap-2">
        {hasExistingLink && onRemove && (
          <Button onClick={handleRemove} className="text-red-600 border-red-600 hover:border-red-400">
            {t('link_dialog.remove_link')}
          </Button>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button onClick={handleCancel}>
          {t('cancel')}
        </Button>
        <Button filled onClick={handleConfirm} disabled={!url.trim()}>
          {hasExistingLink ? t('link_dialog.update_link') : t('link_dialog.add_link')}
        </Button>
      </div>
    </div>
  );

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={hasExistingLink ? t('link_dialog.edit_link') : t('link_dialog.add_link')}
      ariaLabelledBy="link-dialog-title"
      actions={actions}
    >
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('link_dialog.url_label')}
        </label>
        <InputField
          variant="material"
          type="input"
          placeholder={t('link_dialog.url_placeholder')}
          itemId={0} // Dummy ID since we're using local-only mode
          value={url}
          onValueUpdated={(data) => setUrl(data.text || '')}
          helpText={t('link_dialog.url_help')}
          className="w-full"
        />
      </div>
    </DialogShell>
  );
};
