import { ComponentType } from 'react';
import {
  MdOutlineBusiness,
  MdOutlineCategory,
  MdOutlineWorkOutline,
  MdOutlineDescription,
  MdOutlineEmail,
  MdOutlineFolderOpen,
  MdOutlineEventNote,
  MdOutlineGroups,
  MdOutlineBallot,
  MdOutlineHome,
  MdOutlineLock,
  MdOutlinePalette,
  MdOutlinePlace,
  MdOutlineSettings,
  MdOutlineVerified,
  MdOutlineWorkspacePremium,
} from 'react-icons/md';

/**
 * Capability required to access a settings nav item.
 *
 * NOTE: 'superAdmin' is a frontend scaffold only — no such role/claim exists
 * yet in Keycloak/Hasura. Items requiring it render locked for everyone.
 */
export type SettingsCapability = 'admin' | 'superAdmin';

export type SettingsNavGroupId = 'platform' | 'notifications' | 'programs' | 'system';

export type SettingsNavItemId =
  | 'appearance'
  | 'jobboerse'
  | 'homepage'
  | 'location-addresses'
  | 'emails'
  | 'programs'
  | 'attendance-certificates'
  | 'project-types'
  | 'projects'
  | 'documentation-instructions'
  | 'onboarding-texts'
  | 'course-groups'
  | 'badges'
  | 'time-zone'
  | 'access'
  | 'organizations';

export type SettingsNavItemDef = {
  id: SettingsNavItemId;
  icon: ComponentType<{ className?: string }>;
  href: string;
  requiredCapability: SettingsCapability;
  status: 'live' | 'soon';
  /** Nav group this item belongs to (sidebar + overview sections). */
  groupId: SettingsNavGroupId;
};

export type SettingsNavGroupDef = {
  id: SettingsNavGroupId;
  items: SettingsNavItemId[];
};

/** Flat registry of all settings nav items. Labels live in manageSettings.nav.items.<id>. */
export const SETTINGS_NAV_ITEMS: Record<SettingsNavItemId, SettingsNavItemDef> = {
  appearance: {
    id: 'appearance',
    icon: MdOutlinePalette,
    href: '/manage/settings/appearance',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'platform',
  },
  jobboerse: {
    id: 'jobboerse',
    icon: MdOutlineWorkOutline,
    href: '/manage/settings/jobboerse',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'platform',
  },
  homepage: {
    id: 'homepage',
    icon: MdOutlineHome,
    href: '/manage/settings/homepage',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'platform',
  },
  'location-addresses': {
    id: 'location-addresses',
    icon: MdOutlinePlace,
    href: '/manage/settings/location-addresses',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'platform',
  },
  emails: {
    id: 'emails',
    icon: MdOutlineEmail,
    href: '/manage/settings/emails',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'notifications',
  },
  programs: {
    id: 'programs',
    icon: MdOutlineBallot,
    href: '/manage/settings/programs',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'programs',
  },
  'attendance-certificates': {
    id: 'attendance-certificates',
    icon: MdOutlineVerified,
    href: '/manage/settings/attendance-certificates',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'programs',
  },
  'project-types': {
    id: 'project-types',
    icon: MdOutlineCategory,
    href: '/manage/settings/project-types',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'programs',
  },
  projects: {
    id: 'projects',
    icon: MdOutlineFolderOpen,
    href: '/manage/settings/projects',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'programs',
  },
  'documentation-instructions': {
    id: 'documentation-instructions',
    icon: MdOutlineDescription,
    href: '/manage/settings/documentation-instructions',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'programs',
  },
  'onboarding-texts': {
    id: 'onboarding-texts',
    icon: MdOutlineEventNote,
    href: '/manage/settings/onboarding-texts',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'programs',
  },
  'course-groups': {
    id: 'course-groups',
    icon: MdOutlineGroups,
    href: '/manage/settings/course-groups',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'programs',
  },
  badges: {
    id: 'badges',
    icon: MdOutlineWorkspacePremium,
    href: '/manage/settings/badges',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'programs',
  },
  'time-zone': {
    id: 'time-zone',
    icon: MdOutlineSettings,
    href: '/manage/settings/time-zone',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'system',
  },
  access: {
    id: 'access',
    icon: MdOutlineLock,
    href: '/manage/settings/access',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'system',
  },
  organizations: {
    id: 'organizations',
    icon: MdOutlineBusiness,
    href: '/manage/settings/organizations',
    requiredCapability: 'admin',
    status: 'live',
    groupId: 'system',
  },
};

/** Sidebar / overview group order and membership. */
export const SETTINGS_NAV_GROUPS: SettingsNavGroupDef[] = [
  {
    id: 'platform',
    items: ['appearance', 'homepage', 'jobboerse', 'location-addresses'],
  },
  {
    id: 'notifications',
    items: ['emails'],
  },
  {
    id: 'programs',
    items: [
      'programs',
      'attendance-certificates',
      'project-types',
      'projects',
      'documentation-instructions',
      'onboarding-texts',
      'course-groups',
      'badges',
    ],
  },
  {
    id: 'system',
    items: ['time-zone', 'access', 'organizations'],
  },
];

/** All nav items in display order (overview cards). */
export const SETTINGS_NAV_ITEMS_ORDERED: SettingsNavItemDef[] = SETTINGS_NAV_GROUPS.flatMap(
  (group) => group.items.map((itemId) => SETTINGS_NAV_ITEMS[itemId])
);

/** @deprecated Use SETTINGS_NAV_ITEMS — kept for tests migrating from accordion groups. */
export type SettingsGroupId = SettingsNavItemId;

/** @deprecated Use SETTINGS_NAV_ITEMS_ORDERED */
export const SETTINGS_GROUPS = SETTINGS_NAV_ITEMS_ORDERED;
