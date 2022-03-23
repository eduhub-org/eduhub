import { gql } from "@apollo/client";

export const INSERT_A_COURSE = gql`
  mutation InsertCourse(
    $achievementCertificatePossible: Boolean!
    $attendanceCertificatePossible: Boolean!
    $applicationEnd: date!
    $ects: String!
    $headingDescriptionField1: String!
    $language: String!
    $maxMissedSessions: Int!
    $programId: Int!
    $tagline: String!
    $title: String!
  ) {
    insert_Course(
      objects: {
        achievementCertificatePossible: $achievementCertificatePossible
        attendanceCertificatePossible: $attendanceCertificatePossible
        applicationEnd: $applicationEnd
        ects: $ects
        headingDescriptionField1: $headingDescriptionField1
        language: $language
        maxMissedSessions: $maxMissedSessions
        programId: $programId
        tagline: $tagline
        title: $title
      }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const DELETE_A_COURSE = gql`
  mutation DeleteCourseByPk($id: Int!) {
    delete_Course_by_pk(id: $id) {
      id
    }
  }
`;

/* 
We have to pass setObject 

Example:

$setObject = {
  visivility: true,
}

here 'visivility' is a database column
*/

export const UPDATE_COURSE_PROPERTY = gql`
mutation UpdateCourseByPk($id: Int!, $visibility: Boolean!) {
  update_Course_by_pk(
    pk_columns: {id: $id}
    _set: { visibility: $visibility}
  ) {
    id
  }
}
`
