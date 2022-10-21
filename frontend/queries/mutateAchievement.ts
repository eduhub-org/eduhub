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

export const DELETE_AN_ACHIEVEMENT_OPTION_COURSE = gql`
  mutation DeleteAnAchievementOptionCourse($id: Int!) {
    delete_AchievementOptionCourse_by_pk(id: $id) {
      id
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

export const DELETE_AN_ACHIEVEMENT_OPTION_MENTOR = gql`
  mutation DeleteAnAchievementOptionMentor($id: Int!) {
    delete_AchievementOptionMentor_by_pk(id: $id) {
      id
    }
  }
`;
/* #endregion */
