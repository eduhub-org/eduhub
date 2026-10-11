/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CertificateTemplateType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertCertificateTemplate
// ====================================================

export interface InsertCertificateTemplate_insert_CertificateTemplate_one {
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

export interface InsertCertificateTemplate {
  /**
   * insert a single row into the table: "CertificateTemplate"
   */
  insert_CertificateTemplate_one: InsertCertificateTemplate_insert_CertificateTemplate_one | null;
}

export interface InsertCertificateTemplateVariables {
  name: string;
  type: CertificateTemplateType_enum;
  html: string;
}
