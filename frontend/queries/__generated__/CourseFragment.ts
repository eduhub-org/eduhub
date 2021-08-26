/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: CourseFragment
// ====================================================

export interface CourseFragment_Sessions {
  __typename: "Session";
  Id: number;
  endDateTime: any;
  CourseId: number;
  Description: string;
  Location: string;
  startDateTime: any;
  Name: string;
}

export interface CourseFragment_CourseInstructors_Instructor_User {
  __typename: "User";
  Firstname: string;
  Image: string | null;
  Id: number;
  Lastname: string;
}

export interface CourseFragment_CourseInstructors_Instructor {
  __typename: "Instructor";
  Id: number;
  /**
   * An object relationship
   */
  User: CourseFragment_CourseInstructors_Instructor_User;
  Qualification: string | null;
  Description: string | null;
}

export interface CourseFragment_CourseInstructors {
  __typename: "CourseInstructor";
  Id: number;
  /**
   * An object relationship
   */
  Instructor: CourseFragment_CourseInstructors_Instructor;
}

export interface CourseFragment {
  __typename: "Course";
  Id: number;
  Ects: string;
  Description: string;
  WeekDay: string | null;
  CourseType: number | null;
  Cost: string;
  City: string;
  ApplicationEnd: any;
  Image: string | null;
  Language: string;
  MaxMissedSessions: number;
  MaxParticipants: number;
  Name: string;
  OnlineCourses: string;
  Status: CourseStatus_enum;
  ShortDescription: string;
  LinkChat: string | null;
  LinkVideoCall: string | null;
  TimeStart: any | null;
  TimeEnd: any | null;
  /**
   * An array relationship
   */
  Sessions: CourseFragment_Sessions[];
  /**
   * An array relationship
   */
  CourseInstructors: CourseFragment_CourseInstructors[];
}
