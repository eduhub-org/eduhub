import { ComponentType } from 'react';
import {
  MdOutlineEmail,
  MdOutlineHome,
  MdOutlineLock,
  MdOutlinePalette,
  MdOutlineSchool,
  MdOutlineSettings,
} from 'react-icons/md';

/**
 * Capability required to access a settings group.
 *
 * NOTE: 'superAdmin' is a frontend scaffold only — no such role/claim exists
 * yet in Keycloak/Hasura. Groups requiring it render locked for everyone.
 * Once a real capability model lands (JWT claims / Hasura roles), only
 * `useSettingsCapabilities` in access.ts needs to change.
 */
export type SettingsCapability = 'admin' | 'superAdmin';

export type SettingsGroupId = 'appearance' | 'homepage' | 'emails' | 'programDefaults' | 'system' | 'access';

export type SettingsGroupDef = {
  id: SettingsGroupId;
  /** Icon rendered in the group header. */
  icon: ComponentType<{ className?: string }>;
  /** Capability required to open the group; locked (greyed + padlock) otherwise. */
  requiredCapability: SettingsCapability;
  /** 'soon' renders the group as a non-interactive placeholder. */
  status: 'live' | 'soon';
  /**
   * When set, the group navigates to its own sub-page instead of expanding
   * inline (used for fast-growing sections like email notifications).
   */
  href?: string;
};

/**
 * Single source of truth for the settings page structure. Group labels and
 * descriptions live in the `manageSettings.groups.<id>` translation namespace;
 * which sections render inside each group is mapped in index.tsx.
 */
export const SETTINGS_GROUPS: SettingsGroupDef[] = [
  {
    id: 'appearance',
    icon: MdOutlinePalette,
    requiredCapability: 'admin',
    status: 'live',
  },
  {
    id: 'homepage',
    icon: MdOutlineHome,
    requiredCapability: 'admin',
    status: 'live',
  },
  {
    id: 'emails',
    icon: MdOutlineEmail,
    requiredCapability: 'admin',
    status: 'live',
    href: '/manage/settings/emails',
  },
  {
    id: 'programDefaults',
    icon: MdOutlineSchool,
    requiredCapability: 'admin',
    status: 'live',
  },
  {
    id: 'system',
    icon: MdOutlineSettings,
    requiredCapability: 'admin',
    status: 'live',
  },
  {
    id: 'access',
    icon: MdOutlineLock,
    requiredCapability: 'superAdmin',
    status: 'soon',
  },
];
