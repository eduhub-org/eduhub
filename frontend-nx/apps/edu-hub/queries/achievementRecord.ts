import { gql } from '@apollo/client';
import { ACHIEVEMENT_RECORD_AUTHOR_FRAGMENT } from './AchievementRecordAuthorFragment';
import { ACHIEVEMENT_RECORD_FRAGMENT } from './achievementRecordFragment';

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

export const ACHIEVEMENT_RECORDS_WITH_AUTHORS = gql`
  ${ACHIEVEMENT_RECORD_FRAGMENT}
  ${ACHIEVEMENT_RECORD_AUTHOR_FRAGMENT}
  query AchievementRecordListWithAuthors(
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
      ...AchievementRecordFragment
      AchievementRecordAuthors {
        ...AchievementRecordAuthorFragment
      }
    }
  }
`;
