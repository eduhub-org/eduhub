import { FC } from 'react';
import { Trophy, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { BadgeStatus_enum } from '../../../__generated__/globalTypes';

/**
 * Minimal shape shared by the tile and page badge fragments
 * (`ProjectTileFragment_ProjectBadges` / `ProjectPageFragment_ProjectBadges`).
 */
export interface BadgeLike {
  status: BadgeStatus_enum;
  Badge: {
    title: string;
    description: string | null;
    icon: string | null;
  };
}

/**
 * Picks the badge to surface when a project has several: a won badge always
 * wins over a nomination, otherwise the first badge is used.
 */
export const pickPrimaryBadge = <T extends BadgeLike>(badges: T[] | null | undefined): T | null => {
  if (!badges || badges.length === 0) return null;
  return badges.find((b) => b.status === BadgeStatus_enum.WON) ?? badges[0];
};

/** Compact pill used on project tiles. */
export const BadgeChip: FC<{ badge: BadgeLike; className?: string }> = ({ badge, className = '' }) => {
  const won = badge.status === BadgeStatus_enum.WON;
  const Icon = won ? Trophy : Star;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-badge-contrast ${
        won ? 'bg-badge' : 'border border-badge'
      } ${className}`}
    >
      <Icon size={13} className="shrink-0" />
      <span className="truncate max-w-[9rem]">{badge.Badge.title}</span>
    </span>
  );
};

/** Full-width recognition banner used on the project detail page. */
export const BadgeBanner: FC<{ badge: BadgeLike }> = ({ badge }) => {
  const t = useTranslations('project');
  const won = badge.status === BadgeStatus_enum.WON;
  const Icon = won ? Trophy : Star;
  const statusLabel = won ? t('badge.won') : t('badge.nominated');
  return (
    <div className="flex items-center gap-4 rounded-xl border border-badge bg-bg-card p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-badge text-badge-contrast">
        <Icon size={22} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-label-primary">
          {statusLabel} — {badge.Badge.title}
        </span>
        {badge.Badge.description && (
          <span className="text-sm text-label-secondary">{badge.Badge.description}</span>
        )}
      </div>
    </div>
  );
};
