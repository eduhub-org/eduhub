import { gql } from '@apollo/client';

export const PROGRAM_TYPE_DEFAULTS = gql`
  query ProgramTypeDefaults {
    ProgramType(order_by: { value: asc }) {
      value
      defaultAttendanceCertificateTemplateId
    }
  }
`;

export const UPDATE_PROGRAM_TYPE_DEFAULT_ATTENDANCE_CERTIFICATE_TEMPLATE = gql`
  mutation UpdateProgramTypeDefaultAttendanceCertificateTemplate(
    $value: String!
    $templateId: Int
  ) {
    update_ProgramType_by_pk(
      pk_columns: { value: $value }
      _set: { defaultAttendanceCertificateTemplateId: $templateId }
    ) {
      value
      defaultAttendanceCertificateTemplateId
    }
  }
`;
