import { gql } from "@apollo/client";

export const BATCH_INSERT_MAIL_LOG = gql`
  mutation BatchInsertMail($objects: [MailLog_insert_input!]!) {
    insert_MailLog(objects: $objects) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const HIDE_PROGRAM = gql`
  mutation HideProgramById($id: Int!) {
    update_Program_by_pk(pk_columns: { id: $id }, _set: { visibility: false }) {
      id
    }
  }
`;

export const UPDATE_ASSIGNMENTS = gql`
  mutation UpdateAssignments($objects: [SchoolClassRequest_insert_input!]!) {
    insert_SchoolClassRequest(
      objects: $objects
      on_conflict: {
        constraint: SchoolClassRequest_pkey
        update_columns: [assigned_day]
      }
    ) {
      returning {
        id
      }
    }
  }
`;

export const ALL_REQUESTS = gql`
  query AllRequests {
    SchoolClassRequest {
      id
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
          street
          city
          postalCode
          district
        }
        Teacher {
          id
          User {
            id
            firstName
            lastName
            email
          }
        }
      }

      ScientistOffer {
        id
        title
        description
        contactName
        contactPhone
        contactEmail
        possibleDays
        maxDeployments

        Program {
          id
        }
      }
    }
  }
`;

export const SCIENTIST_MAILS_INFO = gql`
  query ScientistMailInfos($pid: Int!) {
    ScientistOffer(where: { Program: { id: { _eq: $pid } } }) {
      id
      contactName
      contactEmail

      SchoolClassRequests {
        id
        assigned_day
        commentTime
        commentGeneral

        SchoolClass {
          id
          grade
          studensCount

          School {
            dstnr
            name
            street
            city
            postalCode
          }

          Teacher {
            id
            User {
              id
              firstName
              lastName
              email
            }
          }
        }
      }
    }
  }
`;

export const SCHOOLS_MAILS_INFO = gql`
  query SchoolsMailsInfo($pid: Int!) {
    SchoolClassRequest(
      where: { ScientistOffer: { Program: { id: { _eq: $pid } } } }
    ) {
      id
      SchoolClass {
        id
        name
        grade

        Teacher {
          id
          User {
            firstName
            lastName
            email
          }
        }
      }

      assigned_day

      ScientistOffer {
        id
        title
        contactPhone
        contactEmail
        contactName
        timeWindow
      }
    }
  }
`;
