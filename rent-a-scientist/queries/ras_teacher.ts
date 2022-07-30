import { gql } from "@apollo/client";

export const MY_TEACHER = gql`
  query MyTeacher {
    Teacher {
      id
      userId
    }
  }
`;

export const INSERT_MY_TEACHER = gql`
  mutation InsertMyTeacher($myUserId: uuid!) {
    insert_Teacher(objects: { userId: $myUserId }) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const INSERT_SCHOOL_CLASS = gql`
  mutation InsertSchoolClass($input: SchoolClass_insert_input!) {
    insert_SchoolClass_one(object: $input) {
      id
    }
  }
`;

export const DELETE_SCHOOL_CLASS = gql`
  mutation DeleteSchoolClassById($id: Int!) {
    delete_SchoolClass_by_pk(id: $id) {
      id
    }
  }
`;

export const INSERT_CLASS_REQUESTS = gql`
  mutation InsertClassRequests($inputs: [SchoolClassRequest_insert_input!]!) {
    insert_SchoolClassRequest(objects: $inputs) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const MY_REQUESTS = gql`
  query MyRequests {
    SchoolClassRequest {
      id
      offerId
      possibleDays
      assigned_day
      commentTime
      commentGeneral
      SchoolClass {
        id
        name
        studensCount
        grade
        School {
          dstnr
          name
        }
      }
    }
  }
`;
