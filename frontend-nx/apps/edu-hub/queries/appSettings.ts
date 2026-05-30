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
      showFaqSection
      faqCollectionName
      defaultAttendanceCertificateTemplateId
    }
  }
`;

export const UPDATE_APP_SETTINGS_DEFAULT_ATTENDANCE_CERTIFICATE_TEMPLATE = gql`
  mutation UpdateAppSettingsDefaultAttendanceCertificateTemplate(
    $appName: String!
    $value: Int
  ) {
    update_AppSettings_by_pk(
      pk_columns: { appName: $appName }
      _set: { defaultAttendanceCertificateTemplateId: $value }
    ) {
      appName
      defaultAttendanceCertificateTemplateId
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

export const UPDATE_APP_SETTINGS_FAQ_VISIBILITY = gql`
  mutation UpdateFaqVisibility($appName: String!, $value: Boolean!) {
    update_AppSettings_by_pk(
      pk_columns: { appName: $appName }
      _set: { showFaqSection: $value }
    ) {
      appName
      showFaqSection
      faqCollectionName
    }
  }
`;

export const UPDATE_APP_SETTINGS_FAQ_COLLECTION = gql`
  mutation UpdateFaqCollection($appName: String!, $value: String!) {
    update_AppSettings_by_pk(
      pk_columns: { appName: $appName }
      _set: { faqCollectionName: $value }
    ) {
      appName
      showFaqSection
      faqCollectionName
    }
  }
`;

export const FAQ_COLLECTIONS = gql`
  query FaqCollections {
    FaqCollection(order_by: { name: asc }) {
      id
      name
    }
  }
`;
