import { gql } from '@apollo/client';

export const CERTIFICATE_TEMPLATES = gql`
  query CertificateTemplates {
    CertificateTemplate(order_by: { name: asc }) {
      id
      name
    }
  }
`;

export const CERTIFICATE_TEMPLATES_WITH_HTML = gql`
  query CertificateTemplatesWithHtml {
    CertificateTemplate(order_by: { name: asc }) {
      id
      name
      html
      updated_at
    }
  }
`;

export const UPDATE_CERTIFICATE_TEMPLATE_HTML = gql`
  mutation UpdateCertificateTemplateHtml($id: Int!, $html: String!) {
    update_CertificateTemplate_by_pk(
      pk_columns: { id: $id }
      _set: { html: $html }
    ) {
      id
      html
      updated_at
    }
  }
`;
