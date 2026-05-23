import React, { FC, useEffect, useState } from 'react';
import { GetApp } from '@mui/icons-material';
import { Button } from '../common/Button';
import { useSignedUrl } from '../../hooks/signedUrl';
import { useTranslations } from 'next-intl';
import { ErrorMessageDialog } from '../common/dialogs/ErrorMessageDialog';

interface IProps {
  filePath: string;
  className?: string;
  label?: string;
  type?: 'button' | 'icon';
}

// Paths starting with `/` are served from the Next.js `public/` folder and
// paths starting with `http(s)://` are already absolute; both should be
// opened directly without going through the GCS signing action.
const isDirectAssetUrl = (path: string): boolean =>
  path.startsWith('/') || path.startsWith('http://') || path.startsWith('https://');

const FileDownload: FC<IProps> = ({ filePath, className, label, type = 'icon' }) => {
  const t = useTranslations();

  const directAsset = isDirectAssetUrl(filePath);

  const { getSignedUrl, loading, error } = useSignedUrl(filePath);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  useEffect(() => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      setDownloadUrl(null); // Reset the URL after opening
    }
  }, [downloadUrl]);

  useEffect(() => {
    if (!directAsset && error) {
      setIsErrorDialogOpen(true);
    }
  }, [error, directAsset]);

  const handleDownload = async () => {
    if (directAsset) {
      window.open(filePath, '_blank');
      return;
    }
    if (!loading && !error) {
      const result = await getSignedUrl();
      const url = result.url;
      if (url) {
        setDownloadUrl(url);
      } else {
        // Handle the case where no URL is returned
        console.error('No URL returned for download');
      }
    }
  };

  const handleCloseErrorDialog = () => {
    setIsErrorDialogOpen(false);
  };

  return (
    <>
      {type === 'button' ? (
        <Button onClick={handleDownload} disabled={!directAsset && loading} className={className} inverted>
          <GetApp /> {label ? label : t('common.download')}
        </Button>
      ) : (
        <button onClick={handleDownload} disabled={!directAsset && loading} className={className}>
          <GetApp />
        </button>
      )}

      {isErrorDialogOpen && (
        <ErrorMessageDialog
          open={isErrorDialogOpen}
          onClose={handleCloseErrorDialog}
          errorMessage={error?.message || t('common.error_occurred')}
        />
      )}
    </>
  );
};

export default FileDownload;
