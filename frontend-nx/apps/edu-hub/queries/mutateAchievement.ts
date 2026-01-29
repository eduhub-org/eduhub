import { gql } from "@apollo/client";

export const INSERT_AN_ACHIEVEMENT_OPTION = gql`
  mutation InsertAnAchievementOption($data: AchievementOption_insert_input!) {
    insert_AchievementOption_one(object: $data) {
      id
    }
  }
`;

export const UPDATE_AN_ACHIEVEMENT_OPTION = gql`
  mutation UpdateAnAchievementOption(
    $id: Int!
    $changes: AchievementOption_set_input
  ) {
    update_AchievementOption_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
    }
  }
`;

export const DELETE_AN_ACHIEVEMENT_OPTION = gql`
  mutation DeleteAnAchievementOption($id: Int!) {
    delete_AchievementOption_by_pk(id: $id) {
      id
    }
  }
`;

/* #region AchievementOptionCourses */
export const INSERT_AN_ACHIEVEMENT_OPTION_COURSE = gql`
  mutation InsertAnAchievementOptionCourse(
    $data: AchievementOptionCourse_insert_input!
  ) {
    insert_AchievementOptionCourse_one(object: $data) {
      id
    }
  }
`;

export const UPDATE_AN_ACHIEVEMENT_OPTION_COURSE = gql`
  mutation UpdateAnAchievementOptionCourse(
    $id: Int!
    $changes: AchievementOptionCourse_set_input
  ) {
    update_AchievementOptionCourse_by_pk(
      pk_columns: { id: $id }
      _set: $changes
    ) {
      id
    }
  }
`;

export const DELETE_AN_ACHIEVEMENT_OPTION_COURSE_BY_PK = gql`
  mutation DeleteAnAchievementOptionCourse($id: Int!) {
    delete_AchievementOptionCourse_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_AN_ACHIEVEMENT_OPTION_COURSE = gql`
  mutation DeleteAnAchievementOptionCourseWithWhere(
    $where: AchievementOptionCourse_bool_exp! = {}
  ) {
    delete_AchievementOptionCourse(where: $where) {
      affected_rows
    }
  }
`;
/* #endregion */

/* #region AchievementOptionMentors */
export const INSERT_AN_ACHIEVEMENT_OPTION_MENTOR = gql`
  mutation InsertAnAchievementOptionMentor(
    $data: AchievementOptionMentor_insert_input!
  ) {
    insert_AchievementOptionMentor_one(object: $data) {
      id
    }
  }
`;

export const UPDATE_AN_ACHIEVEMENT_OPTION_MENTOR = gql`
  mutation UpdateAnAchievementOptionMentor(
    $id: Int!
    $changes: AchievementOptionMentor_set_input
  ) {
    update_AchievementOptionMentor_by_pk(
      pk_columns: { id: $id }
      _set: $changes
    ) {
      id
    }
  }
`;

export const DELETE_AN_ACHIEVEMENT_OPTION_MENTOR_BY_PK = gql`
  mutation DeleteAnAchievementOptionMentor($id: Int!) {
    delete_AchievementOptionMentor_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_AN_ACHIEVEMENT_OPTION_MENTOR = gql`
  mutation DeleteAnAchievementOptionMentorWithWhere(
    $where: AchievementOptionMentor_bool_exp! = {}
  ) {
    delete_AchievementOptionMentor(where: $where) {
      affected_rows
    }
  }
`;
/* #endregion */

/* #region Individual Field Update Mutations */
export const UPDATE_ACHIEVEMENT_OPTION_TITLE = gql`
  mutation UpdateAchievementOptionTitle($itemId: Int!, $text: String!) {
    update_AchievementOption_by_pk(pk_columns: { id: $itemId }, _set: { title: $text }) {
      id
    }
  }
`;

export const UPDATE_ACHIEVEMENT_OPTION_DESCRIPTION = gql`
  mutation UpdateAchievementOptionDescription($itemId: Int!, $text: String!) {
    update_AchievementOption_by_pk(pk_columns: { id: $itemId }, _set: { description: $text }) {
      id
    }
  }
`;

export const UPDATE_ACHIEVEMENT_OPTION_RECORD_TYPE = gql`
  mutation UpdateAchievementOptionRecordType($itemId: Int!, $value: AchievementRecordType_enum!) {
    update_AchievementOption_by_pk(pk_columns: { id: $itemId }, _set: { recordType: $value }) {
      id
    }
  }
`;

export const UPDATE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE = gql`
  mutation UpdateAchievementOptionDocumentationTemplate($itemId: Int!, $value: Int) {
    update_AchievementOption_by_pk(pk_columns: { id: $itemId }, _set: { achievementDocumentationTemplateId: $value }) {
      id
    }
  }
`;
/* #endregion */
