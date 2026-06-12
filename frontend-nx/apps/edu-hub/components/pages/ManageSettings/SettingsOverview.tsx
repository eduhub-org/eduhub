import Link from 'next/link';
import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { MdArrowForward, MdOutlineLock } from 'react-icons/md';

import { SETTINGS_NAV_GROUPS, SETTINGS_NAV_ITEMS } from './config';
import { useCanAccessSettingsItem } from './access';

const OverviewCard: FC<{ itemId: keyof typeof SETTINGS_NAV_ITEMS }> = ({ itemId }) => {
  const t = useTranslations('manageSettings');
  const item = SETTINGS_NAV_ITEMS[itemId];
  const canAccess = useCanAccessSettingsItem(item);
  const Icon = item.icon;
  const locked = !canAccess || item.status === 'soon';

  if (locked) {
    return (
      <div
        className="flex items-center gap-4 rounded-lg border border-border-primary bg-bg-card p-4 opacity-50"
        aria-disabled="true"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-label-tertiary">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-label-primary">
            {t(`nav.items.${item.id}.label`)}
          </span>
          <span className="block text-xs text-label-tertiary">
            {t(`nav.items.${item.id}.description`)}
          </span>
        </span>
        <MdOutlineLock className="h-5 w-5 shrink-0 text-label-tertiary" />
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className="group flex items-center gap-4 rounded-lg border border-border-primary bg-bg-card p-4 transition-colors hover:border-brand"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-label-primary group-hover:text-brand">
          {t(`nav.items.${item.id}.label`)}
        </span>
        <span className="block text-xs text-label-secondary">
          {t(`nav.items.${item.id}.description`)}
        </span>
      </span>
      <MdArrowForward className="h-5 w-5 shrink-0 text-brand opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
};

const SettingsOverview: FC = () => {
  const t = useTranslations('manageSettings');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-label-primary lg:hidden">{t('title')}</h1>
        <p className="mt-1 text-sm text-label-secondary">{t('overview_lead')}</p>
      </div>

      {SETTINGS_NAV_GROUPS.map((group) => (
        <section key={group.id}>
          <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-label-tertiary">
            {t(`nav.groups.${group.id}`)}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((itemId) => (
              <OverviewCard key={itemId} itemId={itemId} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default SettingsOverview;
