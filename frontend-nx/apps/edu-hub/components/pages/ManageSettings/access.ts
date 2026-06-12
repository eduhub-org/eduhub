import { useMemo } from 'react';

import { useIsAdmin } from '../../../hooks/authentication';
import type { SettingsCapability, SettingsGroupDef } from './config';

/**
 * Capabilities of the current user with respect to the settings page.
 *
 * Frontend scaffold only — this is a visibility/UX gate, NOT a security
 * boundary. Actual enforcement happens through Hasura permissions on the
 * underlying queries/mutations. When a real granular permission model lands
 * (e.g. per-section JWT claims), extend this hook; the rest of the settings
 * UI reads capabilities exclusively through it.
 */
export const useSettingsCapabilities = (): Set<SettingsCapability> => {
  const isAdmin = useIsAdmin();

  return useMemo(() => {
    const capabilities = new Set<SettingsCapability>();
    if (isAdmin) {
      capabilities.add('admin');
      // 'superAdmin' is intentionally never granted yet — see config.ts.
    }
    return capabilities;
  }, [isAdmin]);
};

export const useCanAccessSettingsGroup = (group: SettingsGroupDef): boolean => {
  const capabilities = useSettingsCapabilities();
  return capabilities.has(group.requiredCapability);
};
