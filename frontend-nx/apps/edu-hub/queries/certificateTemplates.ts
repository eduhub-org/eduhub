import { gql } from '@apollo/client';

export const CERTIFICATE_TEMPLATES = gql`
  query CertificateTemplates {
    CertificateTemplate(order_by: { name: asc }) {
      id
      name
    }
  }
`;
