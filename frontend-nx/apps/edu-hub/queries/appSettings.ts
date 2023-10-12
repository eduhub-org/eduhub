import { gql } from '@apollo/client';

export const APP_SETTINGS = gql`
  query AppSettings {
    AppSettings {
      backgroundImageURL
      bannerBackgroundColor
      bannerFontColor
      bannerTextDe
      bannerTextEn
      id
      previewImageURL
    }
  }
`;


export const UPDATE_APP_SETTINGS = gql`
  mutation UpdateAppSettings(
    # $backgroundImageURL: String
    $bannerBackgroundColor: String
    $bannerFontColor: String
    $bannerTextDe: String
    $bannerTextEn: String
    $id: Int!
    # $previewImageURL: String
  ) {
    update_AppSettings_by_pk(
      pk_columns: { id: $id }
      _set: {
        # backgroundImageURL: $backgroundImageURL
        bannerBackgroundColor: $bannerBackgroundColor
        bannerFontColor: $bannerFontColor
        bannerTextDe: $bannerTextDe
        bannerTextEn: $bannerTextEn
        # previewImageURL: $previewImageURL
      }
    ) {
      # backgroundImageURL
      bannerBackgroundColor
      bannerFontColor
      bannerTextDe
      bannerTextEn
      id
      # previewImageURL
    }
  }
`;
