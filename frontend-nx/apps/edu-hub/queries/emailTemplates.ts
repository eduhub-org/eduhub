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
      type
      courseId
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

// InputField-compatible mutation for email template subject
export const UPDATE_EMAIL_TEMPLATE_SUBJECT_TEXT = gql`
  mutation UpdateEmailTemplateSubjectText($itemId: Int!, $text: String!) {
    update_MailTemplate_by_pk(
      pk_columns: { id: $itemId },
      _set: { subject: $text }
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

// InputField-compatible mutation for email template content
export const UPDATE_EMAIL_TEMPLATE_CONTENT_TEXT = gql`
  mutation UpdateEmailTemplateContentText($itemId: Int!, $text: String!) {
    update_MailTemplate_by_pk(
      pk_columns: { id: $itemId },
      _set: { content: $text }
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

export const INSERT_EMAIL_TEMPLATE = gql`
  mutation InsertEmailTemplate($object: MailTemplate_insert_input!) {
    insert_MailTemplate_one(object: $object) {
      id
      type
      courseId
      subject
      content
      from
      cc
      bcc
    }
  }
`;

export const GET_DEFAULT_TEMPLATES = gql`
  query GetDefaultTemplates {
    MailTemplate(where: { courseId: { _eq: -1 } }) {
      id
      type
      subject
      content
      from
      cc
      bcc
    }
  }
`;

export const GET_COURSE_TEMPLATES_COUNT = gql`
  query GetCourseTemplatesCount($courseId: Int!) {
    MailTemplate_aggregate(where: { courseId: { _eq: $courseId } }) {
      aggregate {
        count
      }
    }
  }
`;