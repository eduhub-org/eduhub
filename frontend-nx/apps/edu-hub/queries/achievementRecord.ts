import { gql } from '@apollo/client';

export const ACHIEVEMENT_RECORD_LIST = gql`
  query AchievementRecordList(
    $where: AchievementRecord_bool_exp! = {}
    $limit: Int = null
    $offset: Int = 0
    $orderBy: AchievementRecord_order_by = { id: desc }
  ) {
    AchievementRecord(
      order_by: [$orderBy]
      where: $where
      limit: $limit
      offset: $offset
    ) {
      id
      uploadUserId
      AchievementRecordAuthors {
        id
        userId
      }
      created_at
    }
  }
`;

export const INSERT_AN_ACHIEVEMENT_RECORD = gql`
  mutation InsertAnAchievementRecord(
    $insertInput: AchievementRecord_insert_input!
  ) {
    insert_AchievementRecord_one(object: $insertInput) {
      id
    }
  }
`;

export const UPDATE_AN_ACHIEVEMENT_RECORD = gql`
  mutation UpdateAchievementRecordByPk(
    $id: Int!
    $setInput: AchievementRecord_set_input!
  ) {
    update_AchievementRecord_by_pk(pk_columns: { id: $id }, _set: $setInput) {
      id
    }
  }
`;

export const ACHIEVEMENT_RECORD_AUTHOR_LIST = gql`
  query AchievementRecordAuthorList(
    $where: AchievementRecordAuthor_bool_exp! = {}
    $limit: Int = null
    $offset: Int = 0
    $orderBy: AchievementRecordAuthor_order_by = { id: desc }
  ) {
    AchievementRecordAuthor(
      order_by: [$orderBy]
      where: $where
      limit: $limit
      offset: $offset
    ) {
      id
      created_at
      User {
        email
        lastName
        firstName
      }
    }
  }
`;

export const INSERT_INTO_ACHIEVEMENT_RECORD_AUTHOR = gql`
  mutation InsertAnAchievementRecordAuthor(
    $insertInput: AchievementRecordAuthor_insert_input!
  ) {
    insert_AchievementRecordAuthor_one(object: $insertInput) {
      id
    }
  }
`;

export const DELETE_AN_ACHIEVEMENT_RECORD_AUTHOR = gql`
  mutation DeleteAchievementRecordAuthorByPk($id: Int!) {
    delete_AchievementRecordAuthor_by_pk(id: $id) {
      id
    }
  }
`;

export const ACHIEVEMENT_OPTIONS = gql`
  query AchievementOptionQuery(
    $where: AchievementOption_bool_exp! = {}
    $limit: Int = null
    $offset: Int = 0
    $orderBy: AchievementOption_order_by = { id: desc }
  ) {
    AchievementOption(
      order_by: [$orderBy]
      where: $where
      limit: $limit
      offset: $offset
    ) {
      csvTemplateUrl
      description
      documentationTemplateUrl
      evaluationScriptUrl
      recordType
      title
      AchievementOptionCourses {
        Course {
          id
          title
          Program {
            title
            shortTitle
            id
          }
        }
      }
      AchievementOptionMentors {
        User {
          firstName
          id
          lastName
        }
      }
      AchievementRecords {
        score
        created_at
        AchievementRecordAuthors {
          User {
            id
            firstName
            lastName
          }
        }
      }
    }
  }
`;
