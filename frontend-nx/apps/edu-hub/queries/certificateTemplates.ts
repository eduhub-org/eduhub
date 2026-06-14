import { gql } from '@apollo/client';

export const CERTIFICATE_TEMPLATES = gql`
  query CertificateTemplates {
    CertificateTemplate(order_by: { name: asc }) {
      id
      name
    }
  }
`;

// Detail query for the selected template only — avoids shipping every template's
// HTML body (up to 50k each) to populate the settings selector.
export const CERTIFICATE_TEMPLATE_HTML = gql`
  query CertificateTemplateHtml($id: Int!) {
    CertificateTemplate_by_pk(id: $id) {
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
