import { gql } from '@apollo/client';

export const APP_SETTINGS = gql`
  query AppSettings($appName: String!) {
    AppSettings(where: { appName: { _eq: $appName } }) {
      appName
      backgroundImageURL
      bannerBackgroundColor
      bannerFontColor
      bannerTextDe
      bannerTextEn
      previewImageURL
      timeZone  
    }
  }
`;

export const UPDATE_APP_SETTINGS_TIME_ZONE = gql`
  mutation UpdateTimeZone($appName: String!, $value: String!) {
    update_AppSettings_by_pk(
      pk_columns: { appName: $appName }
      _set: { timeZone: $value }
    ) {
      appName
      timeZone
    }
  }
`;

export const UPDATE_APP_SETTINGS_BANNER = gql`
  mutation UpdateBanner($appName: String!
    $bannerBackgroundColor: String
    $bannerFontColor: String
    $bannerTextDe: String
    $bannerTextEn: String
  ) {
  update_AppSettings_by_pk(pk_columns: {appName: $appName},
    _set: {
      bannerBackgroundColor: $bannerBackgroundColor
      bannerFontColor: $bannerFontColor
      bannerTextDe: $bannerTextDe
      bannerTextEn: $bannerTextEn }
  ) {
    appName
    backgroundImageURL
    bannerBackgroundColor
    bannerFontColor
    bannerTextEn
    bannerTextDe
  }
}
`;
