import { FC, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

import SettingsSidebar from './SettingsSidebar';
import { SETTINGS_NAV_GROUPS, SETTINGS_NAV_ITEMS, SettingsNavItemId } from './config';
import { canAccessSettingsItem, useSettingsCapabilities } from './access';
import { useIsOrgAdmin } from '../../../hooks/authentication';

type SettingsLayoutProps = {
  children: ReactNode;
  /** When set, shows the section title above children (sub-pages). */
  activeItemId?: SettingsNavItemId;
};

const SettingsLayout: FC<SettingsLayoutProps> = ({ children, activeItemId }) => {
  const t = useTranslations('manageSettings');
  const router = useRouter();
  const capabilities = useSettingsCapabilities();
  const isOrgAdmin = useIsOrgAdmin();
  const activeItem = activeItemId ? SETTINGS_NAV_ITEMS[activeItemId] : undefined;

  const handleMobileNavChange = (value: string) => {
    if (value === '') {
      router.push('/manage/settings');
      return;
    }
    const item = SETTINGS_NAV_ITEMS[value as SettingsNavItemId];
    if (!item || !canAccessSettingsItem(item, capabilities, isOrgAdmin) || item.status === 'soon') {
      return;
    }
    router.push(item.href);
  };

  return (
    <div className="mt-24 w-full max-w-screen-2xl mx-auto px-3 pb-12 min-w-0">
      <div className="mb-4 lg:hidden">
        <label htmlFor="settings-mobile-nav" className="sr-only">
          {t('nav.mobile_label')}
        </label>
        <select
          id="settings-mobile-nav"
          className="w-full rounded border border-border-primary bg-bg-card px-3 py-2 text-sm text-label-primary"
          value={activeItemId ?? ''}
          onChange={(e) => handleMobileNavChange(e.target.value)}
        >
          <option value="">{t('title')}</option>
          {SETTINGS_NAV_GROUPS.map((group) => (
            <optgroup key={group.id} label={t(`nav.groups.${group.id}`)}>
              {group.items.map((itemId) => {
                const item = SETTINGS_NAV_ITEMS[itemId];
                if (!canAccessSettingsItem(item, capabilities, isOrgAdmin) || item.status === 'soon') {
                  return null;
                }
                return (
                  <option key={itemId} value={itemId}>
                    {t(`nav.items.${itemId}.label`)}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="flex w-full min-w-0 gap-0 min-h-[60vh] rounded-xl border border-border-primary bg-bg-primary overflow-hidden">
        <SettingsSidebar className="hidden lg:flex shrink-0" />
        <main className="min-w-0 flex-1 overflow-x-auto px-6 py-6 lg:px-8">
          {activeItem && (
            <header className="mb-6 min-w-0">
              <h1 className="text-xl font-semibold text-label-primary">
                {t(`nav.items.${activeItem.id}.label`)}
              </h1>
              <p className="mt-1 text-sm text-label-secondary">
                {t(`nav.items.${activeItem.id}.description`)}
              </p>
            </header>
          )}
          <div className="min-w-0 w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default SettingsLayout;
