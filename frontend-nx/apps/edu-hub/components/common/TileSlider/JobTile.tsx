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

const JobTileComponent: FC<JobTileProps> = ({ job }) => {
  const t = useTranslations('job');
  const locale = useLocale();
  const publishedLabel = formatPublishedDate(job.publishedAt, locale);
  const logoUrl = resolveStujoLogoUrl(job.Organization.logo);
  const regionLabel = job.region ? t(`region.${job.region}`) : null;
  const locationLine = [job.location, regionLabel].filter(Boolean).join(', ');

  // Job postings have no cover image: use a StuJo-branded flat background with
  // the employer logo on a white card (so dark logos stay legible), plus a
  // smooth bottom-up gradient that fades from dark behind the title to fully
  // transparent, so the pink surface never meets an abrupt darker band and the
  // white title overlay stays readable.
  const imageArea = (
    <>
      <div className="absolute inset-0" style={{ backgroundColor: STUJO_PINK }}></div>
      {logoUrl ? (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="flex items-center justify-center rounded-lg bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={job.Organization.name} className="max-h-[96px] max-w-[180px] object-contain" />
          </div>
        </div>
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 62%)',
        }}
      ></div>
    </>
  );

  return (
    <a href={stujoJobUrl(job.id)} target="_blank" rel="noopener noreferrer" className="block">
      <TileBase coverImage={null} title={job.title} imageArea={imageArea} cornerBadge={<StujoSign />}>
        <div className="flex justify-between items-center gap-2 mb-3 text-sm text-label-primary">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold text-white truncate"
            style={{ backgroundColor: STUJO_PINK }}
          >
            {t(`type.${job.type}`)}
          </span>
          {publishedLabel && (
            <span className="flex items-center gap-1 shrink-0 text-label-secondary">
              <Calendar size={14} className="shrink-0" />
              {t('published_on', { date: publishedLabel })}
            </span>
          )}
        </div>
        <span className="text-lg font-bold mb-auto line-clamp-2 text-label-primary">
          {job.Organization.name}
        </span>
        {locationLine ? <span className="text-sm text-label-secondary mb-3 truncate">{locationLine}</span> : null}
        <div className="flex justify-between items-center gap-2 text-xs text-label-secondary">
          <span className="truncate">{t(`occupation.${job.occupation}`)}</span>
          <ArrowRight size={16} className="shrink-0" style={{ color: STUJO_PINK }} aria-hidden />
        </div>
      </TileBase>
    </a>
  );
};

export const JobTile = memo(JobTileComponent);
