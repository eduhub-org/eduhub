/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertMailLog
// ====================================================

export interface InsertMailLog_insert_MailLog_returning {
  __typename: "MailLog";
  id: number;
}

export interface InsertMailLog_insert_MailLog {
  __typename: "MailLog_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertMailLog_insert_MailLog_returning[];
}

export interface InsertMailLog {
  /**
   * insert data into the table: "MailLog"
   */
  insert_MailLog: InsertMailLog_insert_MailLog | null;
}

export interface InsertMailLogVariables {
  subject: string;
  content: string;
  from: string;
  cc?: string | null;
  bcc?: string | null;
  to: string;
  status: string;
}
