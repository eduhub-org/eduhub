import { gql } from '@apollo/client';

export const UPDATE_USER_PROFILE_PICTURE = gql`
  mutation UpdateUserProfilePicture(
    $userId: uuid!
    $file: String
  ) {
    update_User_by_pk(
      pk_columns: { id: $userId }
      _set: {
        picture: $file
      }
    ) {
      id
      picture
    }
  }
`;

export const UPDATE_USER_FIRST_NAME = gql`
  mutation UpdateUserFirstName($itemId: uuid!, $text: String!) {
    update_User_by_pk(pk_columns: { id: $itemId }, _set: { firstName: $text }) {
      id
      firstName
    }
  }
`;

export const UPDATE_USER_LAST_NAME = gql`
  mutation UpdateUserLastName($itemId: uuid!, $text: String!) {
    update_User_by_pk(pk_columns: { id: $itemId }, _set: { lastName: $text }) {
      id
      lastName
    }
  }
`;

export const UPDATE_USER_OCCUPATION = gql`
  mutation UpdateUserOccupation($userId: uuid!, $value: UserOccupation_enum) {
    update_User_by_pk(pk_columns: { id: $userId }, _set: { occupation: $value }) {
      id
      occupation
    }
  }
`;

export const UPDATE_USER_ORGANIZATION_ID = gql`
  mutation UpdateUserOrganizationId($userId: uuid!, $value: Int) {
    update_User_by_pk(pk_columns: { id: $userId }, _set: { organizationId: $value }) {
      id
      organizationId
    }
  }
`;

export const UPDATE_USER_EXTERNAL_PROFILE = gql`
  mutation UpdateUserExternalProfile($itemId: uuid!, $text: String!) {
    update_User_by_pk(pk_columns: { id: $itemId }, _set: { externalProfile: $text }) {
      id
      externalProfile
    }
  }
`;

export const UPDATE_USER_MATRICULATION_NUMBER = gql`
  mutation UpdateUserMatriculationNumber($itemId: uuid!, $text: String!) {
    update_User_by_pk(pk_columns: { id: $itemId }, _set: { matriculationNumber: $text }) {
      id
      matriculationNumber
    }
  }
`;

export const UPDATE_USER_ZIP_CODE = gql`
  mutation UpdateUserZipCode($itemId: uuid!, $text: String!) {
    update_User_by_pk(pk_columns: { id: $itemId }, _set: { zipCode: $text }) {
      id
      zipCode
    }
  }
`;

export const UPDATE_USER_COUNTRY = gql`
  mutation UpdateUserCountry($userId: uuid!, $value: String) {
    update_User_by_pk(pk_columns: { id: $userId }, _set: { country: $value }) {
      id
      country
    }
  }
`;

