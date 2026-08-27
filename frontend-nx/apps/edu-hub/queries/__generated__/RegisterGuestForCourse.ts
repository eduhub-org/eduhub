/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: RegisterGuestForCourse
// ====================================================

export interface RegisterGuestForCourse_registerGuestForCourse {
  __typename: "RegisterGuestForCourseResult";
  success: boolean;
  error: string | null;
  messageKey: string | null;
}

export interface RegisterGuestForCourse {
  /**
   * Starts an account-less guest registration for an event. Validates that the course opted in to guest registration, then stores a GUEST User and emails a double opt-in link. Creates no enrollment until that link is used.
   */
  registerGuestForCourse: RegisterGuestForCourse_registerGuestForCourse;
}

export interface RegisterGuestForCourseVariables {
  courseId: number;
  firstName: string;
  lastName: string;
  email: string;
  acceptTerms: boolean;
  newsletterOptIn?: boolean | null;
}
