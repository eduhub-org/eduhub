import { graphql } from '../../types/generated';

export const INSERT_AN_ACHIEVEMENT_OPTION = graphql(`
  mutation InsertAnAchievementOption($data: AchievementOption_insert_input!) {
    insert_AchievementOption_one(object: $data) {
      id
    }
  }
`);

export const UPDATE_AN_ACHIEVEMENT_OPTION = graphql(`
  mutation UpdateAnAchievementOption($id: Int!, $changes: AchievementOption_set_input) {
    update_AchievementOption_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
    }
  }
`);

export const DELETE_AN_ACHIEVEMENT_OPTION = graphql(`
  mutation DeleteAnAchievementOption($id: Int!) {
    delete_AchievementOption_by_pk(id: $id) {
      id
    }
  }
`);

/* #region AchievementOptionCourses */
export const INSERT_AN_ACHIEVEMENT_OPTION_COURSE = graphql(`
  mutation InsertAnAchievementOptionCourse($data: AchievementOptionCourse_insert_input!) {
    insert_AchievementOptionCourse_one(object: $data) {
      id
    }
  }
`);

export const UPDATE_AN_ACHIEVEMENT_OPTION_COURSE = graphql(`
  mutation UpdateAnAchievementOptionCourse($id: Int!, $changes: AchievementOptionCourse_set_input) {
    update_AchievementOptionCourse_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
    }
  }
`);

export const DELETE_AN_ACHIEVEMENT_OPTION_COURSE_BY_PK = graphql(`
  mutation DeleteAnAchievementOptionCourse($id: Int!) {
    delete_AchievementOptionCourse_by_pk(id: $id) {
      id
    }
  }
`);

export const DELETE_AN_ACHIEVEMENT_OPTION_COURSE = graphql(`
  mutation DeleteAnAchievementOptionCourseWithWhere($where: AchievementOptionCourse_bool_exp! = {}) {
    delete_AchievementOptionCourse(where: $where) {
      affected_rows
    }
  }
`);
/* #endregion */

/* #region AchievementOptionMentors */
export const INSERT_AN_ACHIEVEMENT_OPTION_MENTOR = graphql(`
  mutation InsertAnAchievementOptionMentor($data: AchievementOptionMentor_insert_input!) {
    insert_AchievementOptionMentor_one(object: $data) {
      id
    }
  }
`);

export const UPDATE_AN_ACHIEVEMENT_OPTION_MENTOR = graphql(`
  mutation UpdateAnAchievementOptionMentor($id: Int!, $changes: AchievementOptionMentor_set_input) {
    update_AchievementOptionMentor_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
    }
  }
`);

export const DELETE_AN_ACHIEVEMENT_OPTION_MENTOR_BY_PK = graphql(`
  mutation DeleteAnAchievementOptionMentor($id: Int!) {
    delete_AchievementOptionMentor_by_pk(id: $id) {
      id
    }
  }
`);

export const DELETE_AN_ACHIEVEMENT_OPTION_MENTOR = graphql(`
  mutation DeleteAnAchievementOptionMentorWithWhere($where: AchievementOptionMentor_bool_exp! = {}) {
    delete_AchievementOptionMentor(where: $where) {
      affected_rows
    }
  }
`);
/* #endregion */
