import enMessages from '../../../locales/en.json';
import deMessages from '../../../locales/de.json';
import { SETTINGS_NAV_GROUPS, SETTINGS_NAV_ITEMS } from './config';

describe('SETTINGS_NAV registry', () => {
  it('has unique nav item ids', () => {
    const ids = Object.keys(SETTINGS_NAV_ITEMS);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('defines an icon and capability for every nav item', () => {
    Object.values(SETTINGS_NAV_ITEMS).forEach((item) => {
      expect(item.icon).toBeDefined();
      expect(['admin', 'superAdmin']).toContain(item.requiredCapability);
      expect(['live', 'soon']).toContain(item.status);
    });
  });

  it('lists every item exactly once across nav groups', () => {
    const grouped = SETTINGS_NAV_GROUPS.flatMap((g) => g.items);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect(grouped.sort()).toEqual(Object.keys(SETTINGS_NAV_ITEMS).sort());
  });

  it.each([
    ['en', enMessages],
    ['de', deMessages],
  ])('has a %s label and description for every nav item', (_locale, messages) => {
    const items = (messages as any).manageSettings?.nav?.items ?? {};
    Object.keys(SETTINGS_NAV_ITEMS).forEach((id) => {
      expect(items[id]?.label).toBeTruthy();
      expect(items[id]?.description).toBeTruthy();
    });
  });

  it('only uses internal routes for in-app settings items', () => {
    Object.values(SETTINGS_NAV_ITEMS)
      .filter((item) => item.href.startsWith('/manage/settings'))
      .forEach((item) => {
        expect(item.href).toMatch(/^\/manage\/settings\//);
      });
  });
});
