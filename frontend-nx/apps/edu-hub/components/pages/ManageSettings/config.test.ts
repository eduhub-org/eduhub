import enMessages from '../../../locales/en.json';
import deMessages from '../../../locales/de.json';
import { SETTINGS_GROUPS } from './config';

describe('SETTINGS_GROUPS registry', () => {
  it('has unique group ids', () => {
    const ids = SETTINGS_GROUPS.map((group) => group.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('defines an icon and capability for every group', () => {
    SETTINGS_GROUPS.forEach((group) => {
      expect(group.icon).toBeDefined();
      expect(['admin', 'superAdmin']).toContain(group.requiredCapability);
      expect(['live', 'soon']).toContain(group.status);
    });
  });

  it.each([
    ['en', enMessages],
    ['de', deMessages],
  ])('has a %s label and description translation for every group', (_locale, messages) => {
    const groups = (messages as any).manageSettings?.groups ?? {};
    SETTINGS_GROUPS.forEach((group) => {
      expect(groups[group.id]?.label).toBeTruthy();
      expect(groups[group.id]?.description).toBeTruthy();
    });
  });

  it('only uses internal routes for sub-page groups', () => {
    SETTINGS_GROUPS.filter((group) => group.href).forEach((group) => {
      expect(group.href).toMatch(/^\/manage\/settings\//);
    });
  });
});
