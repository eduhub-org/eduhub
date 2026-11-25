import { FC, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { MatrixClient } from 'matrix-js-sdk';

interface MatrixImageProps {
  client: MatrixClient;
  /** mxc://server/mediaId */
  mxcUrl: string;
  alt: string;
}

const THUMBNAIL_WIDTH = 640;
const THUMBNAIL_HEIGHT = 480;

/**
 * Media on the homeserver is authenticated (Matrix 1.11): the download needs
 * the access token in the Authorization header, which an <img src> cannot
 * send. So the image is fetched and shown from a blob URL.
 */
const fetchMedia = async (client: MatrixClient, url: string): Promise<string> => {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${client.getAccessToken()}` } });
  if (!response.ok) throw new Error(`Media request failed with HTTP ${response.status}`);
  return URL.createObjectURL(await response.blob());
};

/** An m.image message: a thumbnail that opens the full image. */
const MatrixImage: FC<MatrixImageProps> = ({ client, mxcUrl, alt }) => {
  const t = useTranslations('matrixChat');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    // GET /_matrix/client/v1/media/thumbnail/{server}/{mediaId}?width&height&method=scale
    const url = client.mxcUrlToHttp(mxcUrl, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, 'scale', false, true, true);
    if (!url) {
      setFailed(true);
      return undefined;
    }
    fetchMedia(client, url)
      .then((blobUrl) => {
        objectUrl = blobUrl;
        if (cancelled) URL.revokeObjectURL(blobUrl);
        else setThumbnail(blobUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [client, mxcUrl]);

  const openFull = async () => {
    // GET /_matrix/client/v1/media/download/{server}/{mediaId}
    const url = client.mxcUrlToHttp(mxcUrl, undefined, undefined, undefined, false, true, true);
    if (!url) return;
    const tab = window.open('', '_blank');
    try {
      const blobUrl = await fetchMedia(client, url);
      if (tab) tab.location.href = blobUrl;
    } catch {
      tab?.close();
    }
  };

  if (failed) return <span className="italic opacity-80">{t('image_failed')}</span>;
  if (!thumbnail) return <span className="block h-32 w-48 animate-pulse rounded-lg bg-bg-secondary" aria-label={t('image_loading')} />;

  return (
    <button type="button" onClick={openFull} className="block" title={t('image_open')}>
      {/* eslint-disable-next-line @next/next/no-img-element -- blob URL, not optimisable by next/image */}
      <img src={thumbnail} alt={alt} className="max-h-72 max-w-full rounded-lg" />
    </button>
  );
};

export default MatrixImage;
