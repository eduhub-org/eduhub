import { gql } from '@apollo/client';

export const MY_PRIVACY_NOTICE_STATE = gql`
  query MyPrivacyNoticeState($userId: uuid!) {
    User_by_pk(id: $userId) {
      id
      created_at
      privacyNoticeSeenVersion
    }
  }
`;

export const MARK_PRIVACY_NOTICE_SEEN = gql`
  mutation MarkPrivacyNoticeSeen($userId: uuid!, $version: String!) {
    update_User_by_pk(pk_columns: { id: $userId }, _set: { privacyNoticeSeenVersion: $version }) {
      id
      privacyNoticeSeenVersion
    }
  }
`;
