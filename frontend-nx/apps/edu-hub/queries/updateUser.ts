import { gql } from '@apollo/client';

export const UPDATE_USER = gql`
  mutation updateUser(
    $userId: uuid!
    $firstName: String!
    $lastName: String!
    $email: String!
    $matriculationNumber: String
    $university: University_enum
    $externalProfile: String
    $employment: Employment_enum
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
    }
  }
`;
