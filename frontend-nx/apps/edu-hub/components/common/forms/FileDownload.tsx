import React, { FC, useState } from 'react';
import GetAppIcon from '@material-ui/icons/GetApp';

import { Button } from '../Button';

import { useLazyRoleQuery } from '../../../hooks/authedQuery';
import { LOAD_FILE } from '../../../queries/actions';
import { LoadFile, LoadFileVariables } from '../../../queries/__generated__/LoadFile';
import useTranslation from 'next-translate/useTranslation';

interface IProps {
  filePath: string;
  className?: string;
  label?: string;
  type?: 'button' | 'icon';
}

const FileDownload: FC<IProps> = ({ filePath, className, label, type = 'icon' }) => {
  const { t } = useTranslation();

  const [getFileUrl, { data, loading }] = useLazyRoleQuery<LoadFile, LoadFileVariables>(LOAD_FILE, {
    variables: { path: filePath },
  });

  const [shouldDownload, setShouldDownload] = useState(false);

  const handleDownload = async () => {
    if (!loading) {
      await getFileUrl();
      setShouldDownload(true);
    }
  };

  // Open the link in a new tab when the URL is ready and the download has been triggered
  if (shouldDownload && data && data.loadFile && data.loadFile.link) {
    window.open(data.loadFile.link, '_blank');
    setShouldDownload(false); // Reset the flag
  }

  if (type === 'button') {
    return (
      <Button onClick={handleDownload} disabled={loading} className={className} inverted>
        <GetAppIcon /> {label ? label : t('common:download')}
      </Button>
    );
  }

  return (
    <button onClick={handleDownload} disabled={loading} className={className}>
      <GetAppIcon />
    </button>
  );
};

export default FileDownload;
