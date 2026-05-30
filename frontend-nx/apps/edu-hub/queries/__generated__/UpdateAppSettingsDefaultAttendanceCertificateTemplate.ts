/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateAppSettingsDefaultAttendanceCertificateTemplate
// ====================================================

export interface UpdateAppSettingsDefaultAttendanceCertificateTemplate_update_AppSettings_by_pk {
  __typename: "AppSettings";
  /**
   * Name of the app to which the given settings are applied
   */
  appName: string;
  /**
   * App-level default for Program.attendanceCertificateTemplateId. Copied into every newly inserted Program by the set_program_default_attendance_certificate_template_trg trigger when the program's own attendanceCertificateTemplateId is NULL.
   */
  defaultAttendanceCertificateTemplateId: number | null;
}

export interface UpdateAppSettingsDefaultAttendanceCertificateTemplate {
  /**
   * update single row of the table: "AppSettings"
   */
  update_AppSettings_by_pk: UpdateAppSettingsDefaultAttendanceCertificateTemplate_update_AppSettings_by_pk | null;
}

export interface UpdateAppSettingsDefaultAttendanceCertificateTemplateVariables {
  appName: string;
  value?: number | null;
}
