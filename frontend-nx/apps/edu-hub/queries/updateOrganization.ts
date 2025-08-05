import { gql } from '@apollo/client';

// Commented out until logo field is available in schema
// export const UPDATE_ORGANIZATION_LOGO = gql`
//   mutation UpdateOrganizationLogo(
//     $organizationId: Int!
//     $logo: String
//   ) {
//     update_Organization_by_pk(
//       pk_columns: { id: $organizationId }
//       _set: {
//         logo: $logo
//       }
//     ) {
//       id
//       logo
//     }
//   }
// `; 