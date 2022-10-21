import { gql } from "@apollo/client";
export const ACHIEVEMENT_OPTION_COURSES = gql`
  query AchievementOptionCourses(
    $where: AchievementOptionCourse_bool_exp! = {}
    $limit: Int = null
    $offset: Int = 0
  ) {
    AchievementOptionCourse(
      order_by: { id: desc }
      where: $where
      limit: $limit
      offset: $offset
    ) {
      AchievementOption {
        title
      }
      id
      courseId
      achievementOptionId
    }
  }
`;
