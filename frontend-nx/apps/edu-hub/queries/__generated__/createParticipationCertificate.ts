/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: createParticipationCertificate
// ====================================================

export interface createParticipationCertificate_createParticipationCertificate {
  __typename: "createCertificateOutput";
  pdf: string;
}

export interface createParticipationCertificate {
  createParticipationCertificate: createParticipationCertificate_createParticipationCertificate | null;
}

export interface createParticipationCertificateVariables {
  template: string;
  firstname: string;
  lastname: string;
  semester: string;
  course_name: string;
  event_entries?: string[] | null;
}
