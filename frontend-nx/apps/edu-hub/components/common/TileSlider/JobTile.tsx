import { FC, memo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight, Calendar } from 'lucide-react';

import { JobTileFragment } from '../../../queries/__generated__/JobTileFragment';
import { TileBase } from './TileBase';
import { StujoSign } from './StujoSign';
import { formatPublishedDate, resolveStujoLogoUrl, stujoJobUrl } from './jobTileHelpers';

interface JobTileProps {
  job: JobTileFragment;
}

// StuJo brand pink (see apps/stujo/styles/globals.css --stujo-primary).
const STUJO_PINK = '#a71580';

// Header gradient: bright magenta at the logo strip → dark under the title (D2).
const HEADER_GRADIENT =
  'linear-gradient(180deg, #C91A99 0%, #A71580 40%, #5C0A48 75%, #1A0012 100%)';

const JobTileComponent: FC<JobTileProps> = ({ job }) => {
  const t = useTranslations('job');
  const locale = useLocale();
  const publishedLabel = formatPublishedDate(job.publishedAt, locale);
  const logoUrl = resolveStujoLogoUrl(job.Organization.logo);
  const regionLabel = job.region ? t(`region.${job.region}`) : null;
  const locationLine = [job.location, regionLabel].filter(Boolean).join(', ');

  // Logo strip only — title is rendered by TileBase (with shared font sizing).
  const imageArea = (
    <div className="absolute inset-0 flex flex-col" style={{ background: HEADER_GRADIENT }}>
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-4 pb-2">
        {logoUrl ? (
          <div className="flex h-14 items-center justify-center rounded-[10px] bg-white px-3.5 py-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={job.Organization.name}
              className="max-h-9 max-w-[120px] object-contain"
            />
          </div>
        ) : (
          <div />
        )}
        <StujoSign />
      </div>
    </div>
  );

  return (
    <a href={stujoJobUrl(job.id)} target="_blank" rel="noopener noreferrer" className="block">
      <TileBase coverImage={null} title={job.title} imageArea={imageArea}>
        <div className="flex flex-col h-full justify-between gap-3">
          <div className="flex flex-col gap-2.5 min-w-0">
            <span
              className="self-start rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide text-white truncate max-w-full"
              style={{ backgroundColor: STUJO_PINK }}
            >
              {t(`type.${job.type}`)}
            </span>
            <span className="text-lg font-bold line-clamp-2 text-label-primary">
              {job.Organization.name}
            </span>
            {locationLine ? (
              <span className="text-sm text-label-secondary truncate">{locationLine}</span>
            ) : null}
          </div>
          <div className="flex flex-col gap-2.5 min-w-0">
            {publishedLabel ? (
              <span className="flex items-center gap-1.5 text-[13px] text-label-secondary">
                <Calendar size={14} className="shrink-0" />
                {t('published_on', { date: publishedLabel })}
              </span>
            ) : null}
            <div className="flex justify-between items-center gap-2 text-xs text-label-secondary">
              <span className="truncate">{t(`occupation.${job.occupation}`)}</span>
              <ArrowRight size={16} className="shrink-0" style={{ color: STUJO_PINK }} aria-hidden />
            </div>
          </div>
        </div>
      </TileBase>
    </a>
  );
};

export const JobTile = memo(JobTileComponent);
