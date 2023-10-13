import { gql } from '@apollo/client';

export const APP_SETTINGS = gql`
  query AppSettings($appName: String!) {
    AppSettings(where: { appName: { _eq: $appName } }) {
      id
      appName
      backgroundImageURL
      bannerBackgroundColor
      bannerFontColor
      bannerTextDe
      bannerTextEn
      previewImageURL
    }
  }
`;

export const UPDATE_APP_SETTINGS = gql`
  mutation UpdateAppSettings(
    $id: Int!
    $appName: String!
    # $backgroundImageURL: String
    $bannerBackgroundColor: String
    $bannerFontColor: String
    $bannerTextDe: String
    $bannerTextEn: String
    # $previewImageURL: String
  ) {
    update_AppSettings_by_pk(
      pk_columns: { id: $id }
      _set: {
        appName: $appName
        # backgroundImageURL: $backgroundImageURL
        bannerBackgroundColor: $bannerBackgroundColor
        bannerFontColor: $bannerFontColor
        bannerTextDe: $bannerTextDe
        bannerTextEn: $bannerTextEn
        # previewImageURL: $previewImageURL
      }
    ) {
      id
      appName
      # backgroundImageURL
      bannerBackgroundColor
      bannerFontColor
      bannerTextDe
      bannerTextEn
      # previewImageURL
    }
  }
`;
