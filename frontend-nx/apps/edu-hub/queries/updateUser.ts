import { gql } from '@apollo/client';

export const UPDATE_USER = gql`
  mutation updateUser(
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

export const UPDATE_USER_PROFILE_PICTURE = gql`
  mutation updateUserProfilePicture(
    $userId: uuid!
    $picture: String
  ) {
    update_User_by_pk(
      pk_columns: { id: $userId }
      _set: {
        picture: $picture
      }
    ) {
      picture
    }
  }
`;
