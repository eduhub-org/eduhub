import { graphql } from '../../types/generated';

export const MAIL_TEMPLATES = graphql(`
  query MailTemplates {
    MailTemplate {
      id
      subject
      content
      from
      cc
      bcc
      title
    }
  }
`);

export const INSERT_MAIL_LOG = graphql(`
  mutation InsertMailLog(
    $subject: String!
    $content: String!
    $from: String!
    $cc: String
    $bcc: String
    $to: String!
    $status: String!
  ) {
    insert_MailLog(
      objects: { subject: $subject, content: $content, from: $from, cc: $cc, bcc: $bcc, to: $to, status: $status }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`);
