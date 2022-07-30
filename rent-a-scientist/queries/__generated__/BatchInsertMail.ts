/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { MailLog_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: BatchInsertMail
// ====================================================

export interface BatchInsertMail_insert_MailLog_returning {
  __typename: "MailLog";
  id: number;
}

export interface BatchInsertMail_insert_MailLog {
  __typename: "MailLog_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: BatchInsertMail_insert_MailLog_returning[];
}

export interface BatchInsertMail {
  /**
   * insert data into the table: "MailLog"
   */
  insert_MailLog: BatchInsertMail_insert_MailLog | null;
}

export interface BatchInsertMailVariables {
  objects: MailLog_insert_input[];
}
