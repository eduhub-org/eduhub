/* tslint:disable */
/* eslint-disable */
// @generated
// Manually aligned with UPDATE_ENROLLMENT_STATUS_WHEN_APPLIED; run yarn apollo when Hasura is available.

import { CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateEnrollmentStatusWhenApplied
// ====================================================

export interface UpdateEnrollmentStatusWhenApplied_update_CourseEnrollment_returning {
  __typename: "CourseEnrollment";
  id: number;
}

export interface UpdateEnrollmentStatusWhenApplied_update_CourseEnrollment {
  __typename: "CourseEnrollment_mutation_response";
  affected_rows: number;
  returning: UpdateEnrollmentStatusWhenApplied_update_CourseEnrollment_returning[];
}

export interface UpdateEnrollmentStatusWhenApplied {
  update_CourseEnrollment: UpdateEnrollmentStatusWhenApplied_update_CourseEnrollment | null;
}

export interface UpdateEnrollmentStatusWhenAppliedVariables {
  enrollmentIds: number[];
  status: CourseEnrollmentStatus_enum;
  expire?: any | null;
}
