import { gql } from "@apollo/client";

export const EMAIL_TEMPLATES_LIST = gql`
  query EmailTemplatesList(
    $limit: Int = 15
    $offset: Int = 0
    $filter: MailTemplate_bool_exp = {}
    $order_by: [MailTemplate_order_by!] = {updated_at: desc}
  ) {
    MailTemplate(
      limit: $limit
      offset: $offset
      where: $filter
      order_by: $order_by
    ) {
      id
      title
      subject
      content
      from
      cc
      bcc
      created_at
      updated_at
    }
    MailTemplate_aggregate(where: $filter) {
      aggregate {
        count
      }
    }
  }
`;

export const UPDATE_EMAIL_TEMPLATE_SUBJECT = gql`
  mutation UpdateEmailTemplateSubject($id: Int!, $subject: String!) {
    update_MailTemplate_by_pk(
      pk_columns: { id: $id },
      _set: { subject: $subject }
    ) {
      id
      subject
      updated_at
    }
  }
`;

export const UPDATE_EMAIL_TEMPLATE_CONTENT = gql`
  mutation UpdateEmailTemplateContent($id: Int!, $content: String!) {
    update_MailTemplate_by_pk(
      pk_columns: { id: $id },
      _set: { content: $content }
    ) {
      id
      content
      updated_at
    }
  }
`;

export const DELETE_EMAIL_TEMPLATE = gql`
  mutation DeleteEmailTemplate($id: Int!) {
    delete_MailTemplate_by_pk(id: $id) {
      id
    }
  }
`; 