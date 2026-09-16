import { FC } from 'react';
import { useTranslations } from 'next-intl';

import { getPublicImageUrl } from '../../../helpers/filehandling';

interface FundingOrganization {
  id: number;
  Organization: {
    id: number;
    name: string;
    logo: string | null;
  };
}

interface IProps {
  courseFundingOrganizations: FundingOrganization[];
}

const LOGO_SIZE = 512;
const LOGO_HEIGHT = 80;
const LOGO_WIDTH = 400;

export const FundingOrganizations: FC<IProps> = ({ courseFundingOrganizations }) => {
  const t = useTranslations('course');

  const organizationsWithLogos = courseFundingOrganizations.filter(
    (cfo) => cfo.Organization?.logo
  );

  if (organizationsWithLogos.length === 0) {
    return null;
  }

  // Same story as DescriptionFields: this was the "invited" status orange used
  // as decoration. The logos need a light surface, so it keeps `light` and
  // drops the tint.
  return (
    <div className="bg-fill-primary text-label-primary light rounded-2xl p-6 mx-6 xl:mx-0">
      <span className="text-sm font-medium tracking-wide mb-4 block text-label-secondary">
        {t('funded_by')}
      </span>
      <div className="flex flex-col sm:flex-row flex-wrap items-center gap-6 sm:gap-8">
        {organizationsWithLogos.map((cfo) => {
          const logo = cfo.Organization.logo;
          if (!logo) return null;
          const logoUrl = getPublicImageUrl(logo, LOGO_SIZE);
          if (!logoUrl) {
            return null;
          }
          return (
            <div
              key={cfo.id}
              className="flex shrink-0 items-center justify-center"
              style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={cfo.Organization.name}
                width={LOGO_WIDTH}
                height={LOGO_HEIGHT}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
