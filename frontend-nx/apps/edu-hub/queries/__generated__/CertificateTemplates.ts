/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CertificateTemplates
// ====================================================

export interface CertificateTemplates_CertificateTemplate {
  __typename: "CertificateTemplate";
  id: number;
  /**
   * Human-readable, unique identifier (e.g. "Default achievement certificate", "Degree certificate - Digital Innovation").
   */
  name: string;
}

export interface CertificateTemplates {
  /**
   * fetch data from the table: "CertificateTemplate"
   */
  CertificateTemplate: CertificateTemplates_CertificateTemplate[];
}
