import React from 'react';
import GetAppIcon from '@material-ui/icons/GetApp';

import { useLazyRoleQuery } from '../../../hooks/authedQuery';
import { LOAD_FILE } from '../../../queries/actions';
import { LoadFile, LoadFileVariables } from '../../../queries/__generated__/LoadFile';

const FileDownload = ({ filePath }) => {
  const [getFileUrl, { data, loading, error }] = useLazyRoleQuery<LoadFile, LoadFileVariables>(LOAD_FILE, {
    variables: { path: filePath },
  });

  return (
    <>
      <button onClick={() => getFileUrl()} disabled={loading}>
        <GetAppIcon />
      </button>
      {!loading && !error && data && data?.loadFile?.link && (
        <a
          target="_blank"
          rel="noreferrer"
          href={data.loadFile.link}
          download
          style={{ display: 'none' }}
          ref={(link) => link && link.click()}
        ></a>
      )}
    </>
  );
};

export default FileDownload;
