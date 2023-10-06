import Image from 'next/image';
import { FC } from 'react';
import mysteryImg from '../../public/images/common/mystery.svg';
import { Course_Course_by_pk_CourseInstructors_Expert_User } from '../../queries/__generated__/Course';
import { isLinkFormat } from '../../helpers/util';
import useTranslation from 'next-translate/useTranslation';

interface ImageSizeMap {
  small: number;
  medium: number;
  large: number;
}

interface FontSizeMap {
  small: string;
  medium: string;
  large: string;
}

interface UserCardProps {
  className?: string;
  user: Course_Course_by_pk_CourseInstructors_Expert_User;
  role?: string; // Optional role label, e.g., "Instructor"
  size?: 'small' | 'medium' | 'large';
}

const UserCard: FC<UserCardProps> = ({ user, role, className, size = 'large' }) => {
  const { t } = useTranslation('course');

  const getProfileLink = (url: string) => {
    if (url.includes('linkedin.com')) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {t('linkedinProfile')}
        </a>
      );
    } else if (url.includes('xing.com')) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
          {t('xingProfile')}
        </a>
      );
    } else {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
          {t('externalProfile')}
        </a>
      );
    }
  };

  const imageSizeMap: ImageSizeMap = {
    small: 50,
    medium: 75,
    large: 100,
  };

  const fontSizeMap: FontSizeMap = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const imageSize = imageSizeMap[size];
  const fontSize = fontSizeMap[size];

  return (
    <div className={className}>
      <div className={`flex flex-shrink-0 items-start mr-4 ${fontSize}`}>
        <Image
          src={user.picture || mysteryImg}
          alt={`${t('common:image_of')} ${user.firstName}`}
          width={imageSize}
          height={imageSize}
          className="rounded-full object-cover"
          style={{ width: `${imageSize}px`, height: `${imageSize}px` }} // enforce image size
        />
      </div>
      <div className={`flex flex-col ${fontSize}`}>
        <span className="mb-1">
          {user.firstName} {user.lastName}
        </span>
        {role && <span className="text-gray-500">{role}</span>}
        {isLinkFormat(user.externalProfile) && (
          <span className="text-gray-500">{getProfileLink(user.externalProfile)}</span>
        )}
      </div>
    </div>
  );
};

export default UserCard;
