import { graphql } from '../../types/generated';

export const ACHIEVEMENT_RECORD_TYPES = graphql(`
  query AchievementRecordTypes {
    AchievementRecordType {
      value
    }
  }
`);

export const ACHIEVEMENT_OPTIONS = graphql(`
  query AchievementOptionList(
    $where: AchievementOption_bool_exp! = {}
    $limit: Int = null
    $offset: Int = 0
    $orderBy: AchievementOption_order_by = { id: desc }
  ) {
    AchievementOption(order_by: [$orderBy], where: $where, limit: $limit, offset: $offset) {
      ...AchievementOptionFragment
      AchievementOptionCourses {
        id
        courseId
        Course {
          title
          Program {
            ...ProgramFragmentMinimumProperties
          }
        }
      }
      AchievementOptionMentors {
        id
        User {
          ...UserFragment
        }
      }
    }
  }
`);

export const ACHIEVEMENT_OPTION_COURSES = graphql(`
  query AchievementOptionCourses(
    $where: AchievementOptionCourse_bool_exp = {}
    $limit: Int = null
    $offset: Int = 0
    $orderByAchievementOptionCourse: AchievementOptionCourse_order_by = { id: desc }
  ) {
    AchievementOptionCourse(
      order_by: [$orderByAchievementOptionCourse]
      where: $where
      limit: $limit
      offset: $offset
    ) {
      AchievementOption {
        ...AchievementOptionFragment
      }
      id
      courseId
      achievementOptionId
      created_at
    }
  }
`);
