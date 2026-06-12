/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CertificateTemplatesWithHtml
// ====================================================

export interface CertificateTemplatesWithHtml_CertificateTemplate {
  __typename: "CertificateTemplate";
  id: number;
  /**
   * Human-readable, unique identifier (e.g. "Default achievement certificate", "Degree certificate - Digital Innovation").
   */
  name: string;
  /**
   * Jinja2 HTML body. Rendering variables depend on the certificate variant: full_name, semester, course_name, ECTS, learningGoalsList, praxisprojekt, online_courses (project-based achievement), successful_participations (degree), event_entries (attendance), template (background image).
   */
  html: string;
  updated_at: any;
}

export interface CertificateTemplatesWithHtml {
  /**
   * fetch data from the table: "CertificateTemplate"
   */
  CertificateTemplate: CertificateTemplatesWithHtml_CertificateTemplate[];
}
