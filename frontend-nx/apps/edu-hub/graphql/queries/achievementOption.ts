import { gql } from '@apollo/client';
import { ACHIEVEMENT_OPTION_FRAGMENT } from '../achievementOptionFragment';
import { PROGRAM_FRAGMENT_MINIMUM_PROPERTIES } from '../programFragment';
import { USER_FRAGMENT } from '../userFragment';

export const ACHIEVEMENT_RECORD_TYPES = gql`
  query AchievementRecordTypes {
    AchievementRecordType {
      value
    }
  }
`;

export const ACHIEVEMENT_OPTIONS = gql`
  ${ACHIEVEMENT_OPTION_FRAGMENT}
  ${USER_FRAGMENT}
  ${PROGRAM_FRAGMENT_MINIMUM_PROPERTIES}
  query AchievementOptionList(
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
`;

export const ACHIEVEMENT_OPTION_COURSES = gql`
  ${ACHIEVEMENT_OPTION_FRAGMENT}
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
        ...AchievementOptionFragment
      }
      id
      courseId
      achievementOptionId
      created_at
    }
  }
`;
