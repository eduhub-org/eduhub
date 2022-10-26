import { gql } from "@apollo/client";
export const ACHIEVEMENT_OPTION_COURSES = gql`
  query AchievementOptionCourses(
    $where: AchievementOptionCourse_bool_exp = {}
    $limit: Int = null
    $offset: Int = 0
    $orderByAchievementOptionCourse: AchievementOptionCourse_order_by = {
      id: desc
    }
  ) {
    AchievementOptionCourse(
      order_by: [$orderByAchievementOptionCourse]
      where: $where
      limit: $limit
      offset: $offset
    ) {
      AchievementOption {
        title
        recordType
        created_at
      }
      id
      courseId
      achievementOptionId
      created_at
    }
  }
`;
