import { gql } from '@apollo/client';

export const UPDATE_USER = gql`
  mutation UpdateUser(
    $userId: uuid!
    $firstName: String
    $lastName: String
    $email: String
    $matriculationNumber: String
    $university: University_enum
    $externalProfile: String
    $employment: Employment_enum
    $picture: String
  ) {
    update_User_by_pk(
      pk_columns: { id: $userId }
      _set: {
        firstName: $firstName
        matriculationNumber: $matriculationNumber
        lastName: $lastName
        employment: $employment
        email: $email
        externalProfile: $externalProfile
        university: $university
        picture: $picture
      }
    ) {
      id
      firstName
      matriculationNumber
      lastName
      employment
      email
      externalProfile
      university
      picture
    }
  }
`;

export const UPDATE_USER_ON_ENROLLMENT_CONFIRMATION = gql`
  mutation UpdateUserOnEnrollmentConfirmation(
    $userId: uuid!
    $matriculationNumber: String
    $otherUniversity: String
    $university: University_enum
    $employment: Employment_enum
  ) {
    update_User_by_pk(
      pk_columns: { id: $userId }
      _set: {
        matriculationNumber: $matriculationNumber
        otherUniversity: $otherUniversity
        employment: $employment
        university: $university
      }
    ) {
      id
      matriculationNumber
      employment
      otherUniversity
      university
    }
  }
`;

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
