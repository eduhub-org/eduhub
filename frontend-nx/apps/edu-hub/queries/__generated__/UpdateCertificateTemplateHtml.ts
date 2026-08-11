/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCertificateTemplateHtml
// ====================================================

export interface UpdateCertificateTemplateHtml_update_CertificateTemplate_by_pk {
  __typename: "CertificateTemplate";
  id: number;
  /**
   * Jinja2 HTML body. Rendering variables depend on the certificate variant: full_name, semester, course_name, ECTS, learningGoalsList, praxisprojekt, online_courses (project-based achievement), successful_participations / passed_participations / event_participations / required_ects / required_ects_display / required_event_count / achieved_ects / achieved_ects_display / attended_event_count (degree), event_entries (attendance), template (background image).
   */
  html: string;
  updated_at: any;
}

export interface UpdateCertificateTemplateHtml {
  /**
   * update single row of the table: "CertificateTemplate"
   */
  update_CertificateTemplate_by_pk: UpdateCertificateTemplateHtml_update_CertificateTemplate_by_pk | null;
}

export interface UpdateCertificateTemplateHtmlVariables {
  id: number;
  html: string;
}
