import { gql } from "@apollo/client";
import { ACHIEVEMENT_OPTION_FRAGMENT } from "./achievementFragment";

export const ACHIEVEMENT_RECORD_TYPES = gql`
  query AchievementRecordTypes {
    AchievementRecordType {
      value
    }
  }
`;

export const ACHIEVEMENT_OPTIONS = gql`
  ${ACHIEVEMENT_OPTION_FRAGMENT}
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
            shortTitle
          }
        }
      }
      AchievementOptionMentors {
        id
        expertId
        Expert {
          User {
            firstName
            lastName
            id
          }
        }
      }
    }
  }
`;
