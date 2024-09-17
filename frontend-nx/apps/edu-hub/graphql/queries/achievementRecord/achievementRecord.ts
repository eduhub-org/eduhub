import { graphql } from '../../../types/generated';

export const INSERT_AN_ACHIEVEMENT_RECORD = graphql(`
  mutation InsertAnAchievementRecord($insertInput: AchievementRecord_insert_input!) {
    insert_AchievementRecord_one(object: $insertInput) {
      id
    }
  }
`);

export const UPDATE_AN_ACHIEVEMENT_RECORD = graphql(`
  mutation UpdateAchievementRecordByPk($id: Int!, $setInput: AchievementRecord_set_input!) {
    update_AchievementRecord_by_pk(pk_columns: { id: $id }, _set: $setInput) {
      id
    }
  }
`);

export const INSERT_INTO_ACHIEVEMENT_RECORD_AUTHOR = graphql(`
  mutation InsertAnAchievementRecordAuthor($insertInput: AchievementRecordAuthor_insert_input!) {
    insert_AchievementRecordAuthor_one(object: $insertInput) {
      id
    }
  }
`);

export const DELETE_AN_ACHIEVEMENT_RECORD_AUTHOR = graphql(`
  mutation DeleteAchievementRecordAuthorByPk($id: Int!) {
    delete_AchievementRecordAuthor_by_pk(id: $id) {
      id
    }
  }
`);

export const ACHIEVEMENT_RECORDS_WITH_AUTHORS = graphql(`
  query AchievementRecordListWithAuthors(
    $where: AchievementRecord_bool_exp! = {}
    $limit: Int = null
    $offset: Int = 0
    $orderBy: AchievementRecord_order_by = { id: desc }
  ) {
    AchievementRecord(order_by: [$orderBy], where: $where, limit: $limit, offset: $offset) {
      ...AchievementRecordFragment
      AchievementRecordAuthors {
        ...AchievementRecordAuthorFragment
      }
    }
  }
`);
