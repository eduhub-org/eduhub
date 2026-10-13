/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CertificateTemplateType_enum } from "./../../__generated__/globalTypes";

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
  /**
   * Kind of document this template renders; selectors only offer templates of the matching type.
   */
  type: CertificateTemplateType_enum;
}

export interface CertificateTemplates {
  /**
   * fetch data from the table: "CertificateTemplate"
   */
  CertificateTemplate: CertificateTemplates_CertificateTemplate[];
}
