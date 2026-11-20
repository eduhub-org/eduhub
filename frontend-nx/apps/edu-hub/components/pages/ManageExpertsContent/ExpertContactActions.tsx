import { FC, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { MdLink, MdMailOutline, MdPersonSearch } from 'react-icons/md';
import { SiElement, SiLinkedin, SiXing } from 'react-icons/si';

import { elementDirectMessageUrl } from '../../../helpers/matrix';
import { ExpertsList_User } from '../../../queries/__generated__/ExpertsList';
import { linkedInSearchUrl, profileKind, profileUrl } from './expertDirectory';

const IconLink: FC<{ href: string; label: string; children: ReactNode; newTab?: boolean }> = ({
  href,
  label,
  children,
  newTab = true,
}) => (
  <a
    href={href}
    aria-label={label}
    title={label}
    className="p-1 text-lg text-label-secondary hover:text-brand"
    onClick={(event) => event.stopPropagation()}
    {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
  >
    {children}
  </a>
);

const PROFILE_ICONS = { linkedin: <SiLinkedin />, xing: <SiXing />, other: <MdLink /> };

/**
 * Profile, mail and chat links of an expert. The profile is the person's own link; without one a
 * LinkedIn people search is offered instead (nothing found that way is stored). Mail and chat are
 * hidden for people marked Do Not Contact.
 */
export const ExpertContactActions: FC<{ expert: ExpertsList_User }> = ({ expert }) => {
  const t = useTranslations('manageExperts');
  const profile = profileUrl(expert.externalProfile);
  const chatUrl = elementDirectMessageUrl(expert.matrixUserHandle);

  return (
    <div className="flex items-center gap-1">
      {profile ? (
        <IconLink href={profile} label={t(`open_profile_${profileKind(profile)}`)}>
          {PROFILE_ICONS[profileKind(profile)]}
        </IconLink>
      ) : (
        <IconLink href={linkedInSearchUrl(expert)} label={t('search_linkedin')}>
          <MdPersonSearch />
        </IconLink>
      )}
      {!expert.doNotContact && expert.email && (
        <IconLink href={`mailto:${expert.email}`} label={t('send_mail')} newTab={false}>
          <MdMailOutline />
        </IconLink>
      )}
      {!expert.doNotContact && chatUrl && (
        <IconLink href={chatUrl} label={t('open_chat')}>
          <SiElement />
        </IconLink>
      )}
    </div>
  );
};
