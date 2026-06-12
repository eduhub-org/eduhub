/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectTypeCertificateTemplate
// ====================================================

export interface UpdateProjectTypeCertificateTemplate_update_ProjectType_by_pk_CertificateTemplate {
  __typename: "CertificateTemplate";
  id: number;
  /**
   * Human-readable, unique identifier (e.g. "Default achievement certificate", "Degree certificate - Digital Innovation").
   */
  name: string;
}

export interface UpdateProjectTypeCertificateTemplate_update_ProjectType_by_pk {
  __typename: "ProjectType";
  value: string;
  /**
   * Default achievement-certificate template for projects of this type. Used when Course.achievementCertificateTemplateId is NULL on the project's course.
   */
  certificateTemplateId: number | null;
  /**
   * An object relationship
   */
  CertificateTemplate: UpdateProjectTypeCertificateTemplate_update_ProjectType_by_pk_CertificateTemplate | null;
}

export interface UpdateProjectTypeCertificateTemplate {
  /**
   * update single row of the table: "ProjectType"
   */
  update_ProjectType_by_pk: UpdateProjectTypeCertificateTemplate_update_ProjectType_by_pk | null;
}

export interface UpdateProjectTypeCertificateTemplateVariables {
  value: string;
  templateId?: number | null;
}
