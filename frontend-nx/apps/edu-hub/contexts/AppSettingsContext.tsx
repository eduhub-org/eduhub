import React, { createContext, useContext, ReactNode } from 'react';
import { useRoleQuery } from '../hooks/authedQuery';
import { APP_SETTINGS } from '../graphql/queries/appSettings';
import { AppSettings } from '../graphql/__generated__/AppSettings';

interface AppSettingsContextType {
  timeZone: string;
  backgroundImageURL: string | null;
  bannerBackgroundColor: string | null;
  bannerFontColor: string | null;
  bannerTextDe: string | null;
  bannerTextEn: string | null;
  previewImageURL: string | null;
  loading: boolean;
  error: any;
}

const defaultSettings: AppSettingsContextType = {
  timeZone: 'Europe/Berlin',
  backgroundImageURL: null,
  bannerBackgroundColor: null,
  bannerFontColor: null,
  bannerTextDe: null,
  bannerTextEn: null,
  previewImageURL: null,
  loading: true,
  error: null,
};

const AppSettingsContext = createContext<AppSettingsContextType>(defaultSettings);

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data, loading, error } = useRoleQuery<AppSettings>(APP_SETTINGS, {
    variables: { appName: 'edu' },
  });

  const settings: AppSettingsContextType = {
    ...defaultSettings,
    ...(data?.AppSettings[0] || {}),
    loading,
    error,
  };

  return <AppSettingsContext.Provider value={settings}>{children}</AppSettingsContext.Provider>;
};

export const useAppSettings = (): AppSettingsContextType => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
