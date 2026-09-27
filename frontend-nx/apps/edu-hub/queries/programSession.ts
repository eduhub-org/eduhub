import { gql } from '@apollo/client';

// Program-wide sessions: Session rows with programId set (and courseId NULL).
// They are shown in every course of the program and managed on the program
// settings page. Title, times, mandatory flag and deletion reuse the Session
// mutations in ./course.

export const PROGRAM_SESSIONS = gql`
  query ProgramSessions($programId: Int!) {
    Session(where: { programId: { _eq: $programId } }, order_by: { startDateTime: asc }) {
      id
      title
      startDateTime
      endDateTime
      isMandatory
      programId
      SessionAddresses {
        id
        address
        locationOption
        locationAddressId
      }
    }
  }
`;

// Program sessions default to optional; the single address row starts online.
export const INSERT_PROGRAM_SESSION = gql`
  mutation InsertProgramSession($programId: Int!, $startTime: timestamptz!, $endTime: timestamptz!) {
    insert_Session_one(
      object: {
        programId: $programId
        title: ""
        description: ""
        isMandatory: false
        startDateTime: $startTime
        endDateTime: $endTime
        SessionAddresses: { data: [{ locationOption: ONLINE }] }
      }
    ) {
      id
    }
  }
`;

// Switching the location option clears the address, which belonged to the old option.
export const UPDATE_PROGRAM_SESSION_LOCATION_OPTION = gql`
  mutation UpdateProgramSessionLocationOption($itemId: Int!, $value: LocationOption_enum!) {
    update_SessionAddress_by_pk(
      pk_columns: { id: $itemId }
      _set: { locationOption: $value, address: "", locationAddressId: null }
    ) {
      id
      locationOption
    }
  }
`;

export const UPDATE_PROGRAM_SESSION_ONLINE_LINK = gql`
  mutation UpdateProgramSessionOnlineLink($itemId: Int!, $text: String!) {
    update_SessionAddress_by_pk(pk_columns: { id: $itemId }, _set: { address: $text }) {
      id
      address
    }
  }
`;
