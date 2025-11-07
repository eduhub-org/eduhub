/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: MakeCertificatePublic
// ====================================================

export interface MakeCertificatePublic_makeCertificatePublic {
  __typename: "makeCertificatePublicOutput";
  success: boolean;
  messageKey: string;
  error: string | null;
  publicUrl: string | null;
}

export interface MakeCertificatePublic {
  /**
   * Makes a certificate file public in storage bucket for LinkedIn sharing
   */
  makeCertificatePublic: MakeCertificatePublic_makeCertificatePublic | null;
}

export interface MakeCertificatePublicVariables {
  certificatePath: string;
}
