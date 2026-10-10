import { gql } from '@apollo/client';

export const CERTIFICATE_TEMPLATES = gql`
  query CertificateTemplates {
    CertificateTemplate(order_by: { name: asc }) {
      id
      name
      type
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
      type
      html
      updated_at
    }
  }
`;

export const INSERT_CERTIFICATE_TEMPLATE = gql`
  mutation InsertCertificateTemplate($name: String!, $type: CertificateTemplateType_enum!, $html: String!) {
    insert_CertificateTemplate_one(object: { name: $name, type: $type, html: $html }) {
      id
      name
      type
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
