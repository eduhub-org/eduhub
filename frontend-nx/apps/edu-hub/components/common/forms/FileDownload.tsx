import React, { useState } from 'react';
import GetAppIcon from '@material-ui/icons/GetApp';

import { useLazyRoleQuery } from '../../../hooks/authedQuery';
import { LOAD_FILE } from '../../../queries/actions';
import { LoadFile, LoadFileVariables } from '../../../queries/__generated__/LoadFile';

const FileDownload = ({ filePath }) => {
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

  return (
    <button onClick={handleDownload} disabled={loading}>
      <GetAppIcon />
    </button>
  );
};

export default FileDownload;
