import { gql } from "@apollo/client";

export const INSERT_A_COURSE = gql`
  mutation InsertCourse(
    $title: String!
    $today: date!
    $instructorID: String!
    $program: String!
    $ects: String!
    $tagline: String!
    $language: String!
    $achievementCertificatePossible: Boolean!
    $headingDescriptionField1: String!
  ) {
    insert_Course(
      objects: {
        title: $title
        ects: $ects
        tagline: $tagline
        language: $language
        applicationEnd: $today
        defaultApplicationEnd: $today
        projectRecordUploadDeadline: $today
        achievementCertificatePossible: $achievementCertificatePossible
        headingDescriptionField1: $headingDescriptionField1
      }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;
