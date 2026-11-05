/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseSessionReminderLeadHours
// ====================================================

export interface UpdateCourseSessionReminderLeadHours_update_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * How many hours before the first session participants get the session reminder email. Null sends none.
   */
  sessionReminderLeadHours: number | null;
}

export interface UpdateCourseSessionReminderLeadHours {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseSessionReminderLeadHours_update_Course_by_pk | null;
}

export interface UpdateCourseSessionReminderLeadHoursVariables {
  courseId: number;
  leadHours?: number | null;
}
