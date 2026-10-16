/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ProgramParticipantEmails
// ====================================================

export interface ProgramParticipantEmails_CourseEnrollment_User {
  __typename: "User";
  id: any;
  /**
   * The user's email address
   */
  email: string;
}

export interface ProgramParticipantEmails_CourseEnrollment {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * An object relationship
   */
  User: ProgramParticipantEmails_CourseEnrollment_User;
}

export interface ProgramParticipantEmails {
  /**
   * fetch data from the table: "CourseEnrollment"
   */
  CourseEnrollment: ProgramParticipantEmails_CourseEnrollment[];
}

export interface ProgramParticipantEmailsVariables {
  programId: number;
}
