import { FC } from 'react';
import { Award } from 'lucide-react';

import { getLucideIcon } from '../../../helpers/lucideIcon';

/**
 * Minimal shape shared by the tile and page badge fragments
 * (`ProjectTileFragment_ProjectBadges` / `ProjectPageFragment_ProjectBadges`).
 * Each badge carries its own title / description / icon; there is no per-link
 * status — winner vs nominee are simply distinct badges.
 */
export interface BadgeLike {
  Badge: {
    title: string;
    description: string | null;
    icon: string | null;
  };
}

/** Picks the badge to surface when a project has several (the first one). */
export const pickPrimaryBadge = <T extends BadgeLike>(badges: T[] | null | undefined): T | null => {
  if (!badges || badges.length === 0) return null;
  return badges[0];
};

/** Compact pill used on project tiles. */
export const BadgeChip: FC<{ badge: BadgeLike; className?: string }> = ({ badge, className = '' }) => {
  const Icon = getLucideIcon(badge.Badge.icon) ?? Award;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-badge px-2.5 py-1 text-xs font-semibold text-badge-contrast ${className}`}
    >
      <Icon size={13} className="shrink-0" />
      <span className="truncate max-w-[9rem]">{badge.Badge.title}</span>
    </span>
  );
};

/** Full-width recognition banner used on the project detail page. */
export const BadgeBanner: FC<{ badge: BadgeLike }> = ({ badge }) => {
  const Icon = getLucideIcon(badge.Badge.icon) ?? Award;
  return (
    <div className="flex items-center gap-4 rounded-xl border border-badge bg-bg-card p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-badge text-badge-contrast">
        <Icon size={22} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-label-primary">{badge.Badge.title}</span>
        {badge.Badge.description && (
          <span className="text-sm text-label-secondary">{badge.Badge.description}</span>
        )}
      </div>
    </div>
  );
};
