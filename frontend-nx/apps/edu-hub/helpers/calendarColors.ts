import { LocationOption_enum } from '../__generated__/globalTypes';

/**
 * EduHub design system colors from globals.css:
 * --eduhub-info: #1982fc
 * --eduhub-success: #A2EBA0
 * --eduhub-warning: #FFA665
 * --eduhub-label-disabled: #888888
 */
export const LOCATION_COLORS: Record<string, { background: string; border: string; text: string }> = {
  [LocationOption_enum.KIEL]: {
    background: '#1982fc20',
    border: '#1982fc',
    text: '#0d4a9e',
  },
  [LocationOption_enum.HEIDE]: {
    background: '#A2EBA020',
    border: '#A2EBA0',
    text: '#3d8f3a',
  },
  [LocationOption_enum.ONLINE]: {
    background: '#FFA66520',
    border: '#FFA665',
    text: '#c45f1a',
  },
  [LocationOption_enum.HAMBURG]: {
    background: '#9c6bff20',
    border: '#9c6bff',
    text: '#5a2e9e',
  },
};

const DEFAULT_COLOR = {
  background: '#88888820',
  border: '#888888',
  text: '#666666',
};

export function getLocationColor(locationOption: string | null | undefined) {
  if (!locationOption) return DEFAULT_COLOR;
  return LOCATION_COLORS[locationOption] ?? DEFAULT_COLOR;
}

export function getLocationLabel(locationOption: string): string {
  return locationOption.charAt(0).toUpperCase() + locationOption.slice(1).toLowerCase();
}
