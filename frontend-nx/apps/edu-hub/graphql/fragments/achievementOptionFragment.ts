import { graphql } from '../../types/generated';

export const ACHIEVEMENT_OPTION_FRAGMENT = graphql(`
  fragment AchievementOptionFragment on AchievementOption {
    id
    title
    description
    recordType
    evaluationScriptUrl
    csvTemplateUrl
    showScoreAuthors
    achievementDocumentationTemplateId
    AchievementOptionTemplate {
      title
      url
    }
  }
`);
