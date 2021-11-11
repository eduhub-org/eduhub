/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertUser
// ====================================================

export interface InsertUser_insert_User_returning {
  __typename: "User";
  id: any;
  /**
   * The user's profile picture
   */
  picture: string | null;
  /**
   * The user's email address
   */
  email: string;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
}

export interface InsertUser_insert_User {
  __typename: "User_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertUser_insert_User_returning[];
}

export interface InsertUser {
  /**
   * insert data into the table: "User"
   */
  insert_User: InsertUser_insert_User | null;
}

export interface InsertUserVariables {
  userId: any;
  firstName: string;
  lastName: string;
  email: string;
}
