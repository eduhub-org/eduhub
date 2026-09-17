import Image from 'next/image';
import { FC, useEffect, useMemo, useState } from 'react';

import { getPublicImageUrl, getPublicUrl } from '../../helpers/filehandling';

interface UserAvatarProps {
  picture: string | null;
  imageSize: number;
  imageResolution: number;
  alt: string;
  className?: string;
  ariaHidden?: boolean;
}

const MYSTERY_AVATAR = '/images/common/mystery.svg';

const UserAvatar: FC<UserAvatarProps> = ({
  picture,
  imageSize,
  imageResolution,
  alt,
  className,
  ariaHidden,
}) => {
  const sources = useMemo(
    () =>
      Array.from(
        new Set(
          [getPublicImageUrl(picture, imageResolution), picture ? getPublicUrl(picture) : null, MYSTERY_AVATAR].filter(
            (source): source is string => Boolean(source)
          )
        )
      ),
    [picture, imageResolution]
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => setSourceIndex(0), [sources]);

  return (
    <Image
      src={sources[sourceIndex]}
      alt={alt}
      aria-hidden={ariaHidden}
      width={imageSize}
      height={imageSize}
      className={className}
      style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
      onError={() => setSourceIndex((index) => Math.min(index + 1, sources.length - 1))}
    />
  );
};

export default UserAvatar;
