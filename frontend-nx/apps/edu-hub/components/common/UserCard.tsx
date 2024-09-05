import Image from 'next/image';
import { FC, useMemo } from 'react';
import mysteryImg from '../../public/images/common/mystery.svg';
import { Course_Course_by_pk_CourseInstructors_Expert_User } from '../../queries/__generated__/Course';
import { isLinkFormat } from '../../helpers/util';
import useTranslation from 'next-translate/useTranslation';
import { getPublicImageUrl } from '../../helpers/filehandling';

type Size = 'small' | 'medium' | 'large';

interface SizeConfig {
  imageSize: number;
  imageSolution: number;
  fontSize: string;
}

const sizeConfigs: Record<Size, SizeConfig> = {
  small: { imageSize: 40, imageSolution: 64, fontSize: 'text-sm' },
  medium: { imageSize: 75, imageSolution: 400, fontSize: 'text-base' },
  large: { imageSize: 100, imageSolution: 400, fontSize: 'text-lg' },
};

interface UserCardProps {
  className?: string;
  user: Course_Course_by_pk_CourseInstructors_Expert_User;
  role?: string;
  size?: Size;
}

const UserCard: FC<UserCardProps> = ({ user, role, className, size = 'large' }) => {
  const { t } = useTranslation('common');

  const { imageSize, imageSolution, fontSize } = sizeConfigs[size];
  const showName = size !== 'small';

  const userPictureUrl = useMemo(
    () => getPublicImageUrl(user?.picture, imageSolution) || mysteryImg,
    [user?.picture, imageSolution]
  );

  const getProfileLink = (url: string) => {
    const safeUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

    let linkText: string;
    if (safeUrl.includes('linkedin.com')) {
      linkText = t('user_card.linkedin_profile');
    } else if (safeUrl.includes('xing.com')) {
      linkText = t('user_card.xing_profile');
    } else {
      linkText = t('user_card.external_profile');
    }

    return (
      <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="underline">
        {linkText}
      </a>
    );
  };

  return (
    <div className={`flex items-start ${className}`}>
      <Image
        src={userPictureUrl}
        alt={`${t('image_of')} ${user?.firstName}`}
        width={imageSize}
        height={imageSize}
        className="rounded-full object-cover mr-4"
      />
      {showName && (
        <div className={`flex flex-col ${fontSize}`}>
          <span className="mb-1">
            {user?.firstName} {user?.lastName}
          </span>
          {role && <span className="text-gray-500">{role}</span>}
          {isLinkFormat(user?.externalProfile) && (
            <span className="text-gray-500">{getProfileLink(user.externalProfile)}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserCard;
