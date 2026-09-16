import { useMemo } from 'react';

import { useIsAdmin, useIsOrgAdmin } from '../../../hooks/authentication';
import { useOrgAdminCapabilities } from '../../../hooks/orgAdminCapabilities';
import type { SettingsCapability, SettingsNavItemDef } from './config';

/**
 * Capabilities of the current user with respect to the settings page.
 *
 * Frontend scaffold only — this is a visibility/UX gate, NOT a security
 * boundary. Actual enforcement happens through Hasura permissions on the
 * underlying queries/mutations.
 */
export const useSettingsCapabilities = (): Set<SettingsCapability> => {
  const isAdmin = useIsAdmin();

  return useMemo(() => {
    const capabilities = new Set<SettingsCapability>();
    if (isAdmin) {
      capabilities.add('admin');
    }
    return capabilities;
  }, [isAdmin]);
};

export const canAccessSettingsItem = (
  item: SettingsNavItemDef,
  capabilities: Set<SettingsCapability>,
  isOrgAdmin: boolean,
  // Org admin holds canManageSettings on at least one organization (mirrors the Hasura write
  // permission that actually gates OrganizationAdmin/Program mutations).
  canManageSettings: boolean
): boolean => {
  if ((item.id === 'access' || item.id === 'programs') && isOrgAdmin && canManageSettings) {
    return true;
  }
  return capabilities.has(item.requiredCapability);
};

export const useCanAccessSettingsItem = (item: SettingsNavItemDef): boolean => {
  const capabilities = useSettingsCapabilities();
  const isOrgAdmin = useIsOrgAdmin();
  const { canManageSettings } = useOrgAdminCapabilities();
  return canAccessSettingsItem(item, capabilities, isOrgAdmin, canManageSettings);
};

/** @deprecated Use useCanAccessSettingsItem */
export const useCanAccessSettingsGroup = useCanAccessSettingsItem;
