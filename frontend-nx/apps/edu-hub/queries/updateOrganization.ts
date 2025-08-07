import { gql } from '@apollo/client';

export const UPDATE_ORGANIZATION_LOGO = gql`
  mutation UpdateOrganizationLogo(
    $organizationId: Int!
    $logo: String
  ) {
    update_Organization_by_pk(
      pk_columns: { id: $organizationId }
      _set: {
        logo: $logo
      }
    ) {
      id
      logo
    }
  }
`; 