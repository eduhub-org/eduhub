import React, { FC, useEffect, useState } from 'react';
import GetAppIcon from '@material-ui/icons/GetApp';
import { Button } from '../common/Button';
import { useSignedUrl } from '../../hooks/signedUrl';
import useTranslation from 'next-translate/useTranslation';
import { ErrorMessageDialog } from '../common/dialogs/ErrorMessageDialog';

interface IProps {
  filePath: string;
  className?: string;
  label?: string;
  type?: 'button' | 'icon';
}

const FileDownload: FC<IProps> = ({ filePath, className, label, type = 'icon' }) => {
  const { t } = useTranslation();

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
    if (error) {
      setIsErrorDialogOpen(true);
    }
  }, [error]);

  const handleDownload = async () => {
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
        <Button onClick={handleDownload} disabled={loading} className={className} inverted>
          <GetAppIcon /> {label ? label : t('common:download')}
        </Button>
      ) : (
        <button onClick={handleDownload} disabled={loading} className={className}>
          <GetAppIcon />
        </button>
      )}

      {isErrorDialogOpen && (
        <ErrorMessageDialog
          open={isErrorDialogOpen}
          onClose={handleCloseErrorDialog}
          errorMessage={error?.message || t('common:error_occurred')}
        />
      )}
    </>
  );
};

export default FileDownload;
