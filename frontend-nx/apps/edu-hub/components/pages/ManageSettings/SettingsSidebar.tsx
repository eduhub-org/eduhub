import Link from 'next/link';
import { FC, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';
import { MdChevronLeft, MdOutlineLock } from 'react-icons/md';

import {
  SETTINGS_NAV_GROUPS,
  SETTINGS_NAV_ITEMS,
  SettingsNavItemDef,
} from './config';
import { useCanAccessSettingsItem } from './access';

type SettingsSidebarProps = {
  className?: string;
};

const NavItem: FC<{ item: SettingsNavItemDef; active: boolean }> = ({ item, active }) => {
  const t = useTranslations('manageSettings');
  const canAccess = useCanAccessSettingsItem(item);
  const Icon = item.icon;
  const locked = !canAccess || item.status === 'soon';

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{t(`nav.items.${item.id}.label`)}</span>
      {locked && <MdOutlineLock className="ml-auto h-4 w-4 shrink-0 text-label-tertiary" />}
    </>
  );

  if (locked) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-label-tertiary opacity-50"
        aria-disabled="true"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? 'border-l-2 border-brand bg-bg-secondary text-label-primary font-medium'
          : 'text-label-secondary hover:bg-bg-secondary hover:text-label-primary'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      {content}
    </Link>
  );
};

const SettingsSidebar: FC<SettingsSidebarProps> = ({ className = '' }) => {
  const t = useTranslations('manageSettings');
  const router = useRouter();

  const activePath = useMemo(() => {
    const path = router.asPath.split('?')[0].split('#')[0];
    if (path === '/manage/settings' || path === '/manage/settings/') {
      return null;
    }
    return path;
  }, [router.asPath]);

  const isOverview = activePath === null;

  return (
    <nav
      className={`flex w-60 shrink-0 flex-col border-r border-border-primary bg-bg-deep ${className}`}
      aria-label={t('title')}
    >
      <div className="border-b border-border-primary px-4 py-4">
        {isOverview ? (
          <h1 className="text-lg font-semibold text-label-primary">{t('title')}</h1>
        ) : (
          <Link
            href="/manage/settings"
            className="flex items-center gap-1 text-lg font-semibold text-label-primary hover:text-brand transition-colors"
          >
            <MdChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
            {t('title')}
          </Link>
        )}
        <p className="mt-1 text-xs text-label-tertiary">{t('subtitle')}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {SETTINGS_NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-label-tertiary">
              {t(`nav.groups.${group.id}`)}
            </p>
            <div className="space-y-0.5">
              {group.items.map((itemId) => {
                const item = SETTINGS_NAV_ITEMS[itemId];
                const active =
                  activePath !== null &&
                  (activePath === item.href || activePath.startsWith(`${item.href}/`));
                return <NavItem key={item.id} item={item} active={active} />;
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
};

export default SettingsSidebar;
