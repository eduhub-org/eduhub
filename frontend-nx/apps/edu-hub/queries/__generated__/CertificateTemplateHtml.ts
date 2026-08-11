/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CertificateTemplateHtml
// ====================================================

export interface CertificateTemplateHtml_CertificateTemplate_by_pk {
  __typename: "CertificateTemplate";
  id: number;
  /**
   * Human-readable, unique identifier (e.g. "Default achievement certificate", "Degree certificate - Digital Innovation").
   */
  name: string;
  /**
   * Jinja2 HTML body. Rendering variables depend on the certificate variant: full_name, semester, course_name, ECTS, learningGoalsList, praxisprojekt, online_courses (project-based achievement), successful_participations / passed_participations / event_participations / required_ects / required_ects_display / required_event_count / achieved_ects / achieved_ects_display / attended_event_count (degree), event_entries (attendance), template (background image).
   */
  html: string;
  updated_at: any;
}

export interface CertificateTemplateHtml {
  /**
   * fetch data from the table: "CertificateTemplate" using primary key columns
   */
  CertificateTemplate_by_pk: CertificateTemplateHtml_CertificateTemplate_by_pk | null;
}

export interface CertificateTemplateHtmlVariables {
  id: number;
}
