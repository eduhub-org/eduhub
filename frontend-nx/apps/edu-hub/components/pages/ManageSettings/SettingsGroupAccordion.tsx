import Link from 'next/link';
import { FC, ReactNode, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MdArrowForward, MdExpandMore, MdOutlineLock } from 'react-icons/md';

import type { SettingsGroupDef } from './config';
import { useCanAccessSettingsGroup } from './access';

type SettingsGroupAccordionProps = {
  group: SettingsGroupDef;
  children?: ReactNode;
};

const headerBase = 'flex w-full items-center gap-4 p-5 text-left';

/**
 * Collapsible group on the settings page. Three render modes:
 * - locked (missing capability or status 'soon'): greyed, padlock, no interaction
 * - link (group.href set): navigates to the group's sub-page
 * - accordion (default): expands inline; body content only mounts when open,
 *   so heavy sections (queries, markdown editors) load lazily
 */
const SettingsGroupAccordion: FC<SettingsGroupAccordionProps> = ({ group, children }) => {
  const t = useTranslations('manageSettings');
  const canAccess = useCanAccessSettingsGroup(group);
  const [open, setOpen] = useState(false);

  // Deep-linking: /manage/settings#appearance opens that group.
  useEffect(() => {
    if (window.location.hash === `#${group.id}`) {
      setOpen(true);
    }
  }, [group.id]);

  const Icon = group.icon;
  const locked = !canAccess || group.status === 'soon';

  const heading = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          locked ? 'bg-gray-700 text-gray-500' : 'bg-bg-secondary text-brand'
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{t(`groups.${group.id}.label`)}</span>
        <span className={`block text-xs ${locked ? 'text-gray-500' : 'text-gray-400'}`}>
          {t(`groups.${group.id}.description`)}
        </span>
      </span>
    </>
  );

  if (locked) {
    return (
      <div id={group.id} className="rounded border border-gray-600 opacity-50">
        <div className={headerBase} aria-disabled="true">
          {heading}
          {group.requiredCapability === 'superAdmin' && (
            <span className="whitespace-nowrap rounded-full border border-gray-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {t('access.superadmin_only')}
            </span>
          )}
          {group.status === 'soon' && (
            <span className="whitespace-nowrap rounded-full border border-warning px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-warning">
              {t('access.coming_soon')}
            </span>
          )}
          <MdOutlineLock className="h-5 w-5 shrink-0 text-gray-500" />
        </div>
      </div>
    );
  }

  if (group.href) {
    return (
      <div id={group.id} className="rounded border border-gray-300 transition-colors hover:border-brand">
        <Link href={group.href} className={headerBase}>
          {heading}
          <MdArrowForward className="h-5 w-5 shrink-0 text-brand" />
        </Link>
      </div>
    );
  }

  return (
    <div id={group.id} className="rounded border border-gray-300">
      <button
        type="button"
        className={`${headerBase} transition-colors hover:text-brand`}
        aria-expanded={open}
        aria-controls={`settings-group-${group.id}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        {heading}
        <MdExpandMore
          className={`h-6 w-6 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div id={`settings-group-${group.id}`} className="border-t border-gray-600 px-5 pb-8">
          {children}
        </div>
      )}
    </div>
  );
};

export default SettingsGroupAccordion;
