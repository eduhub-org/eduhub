import { graphql } from '../../types/generated';

export const APP_SETTINGS = graphql(`
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
`);

export const UPDATE_APP_SETTINGS_TIME_ZONE = graphql(`
  mutation UpdateTimeZone($appName: String!, $value: String!) {
    update_AppSettings_by_pk(pk_columns: { appName: $appName }, _set: { timeZone: $value }) {
      appName
      timeZone
    }
  }
`);

export const UPDATE_APP_SETTINGS_BANNER = graphql(`
  mutation UpdateBanner(
    $appName: String!
    $bannerBackgroundColor: String
    $bannerFontColor: String
    $bannerTextDe: String
    $bannerTextEn: String
  ) {
    update_AppSettings_by_pk(
      pk_columns: { appName: $appName }
      _set: {
        bannerBackgroundColor: $bannerBackgroundColor
        bannerFontColor: $bannerFontColor
        bannerTextDe: $bannerTextDe
        bannerTextEn: $bannerTextEn
      }
    ) {
      appName
      backgroundImageURL
      bannerBackgroundColor
      bannerFontColor
      bannerTextEn
      bannerTextDe
    }
  }
`);
