/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProgramType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: ProgramFragment
// ====================================================

export interface ProgramFragment_Organization {
  __typename: "Organization";
  id: number;
  name: string;
  /**
   * Newsletter provider for this organization. Currently only GHOST is supported.
   */
  newsletterProvider: string;
  /**
   * Optional custom newsletter label shown in participant-facing UIs.
   */
  ghostNewsletterLabel: string | null;
  /**
   * Whether Ghost double opt-in should be used for this organization newsletter.
   */
  ghostNewsletterDoubleOptInEnabled: boolean;
  /**
   * Optional Ghost newsletter list identifier.
   */
  ghostNewsletterListId: string | null;
  /**
   * Optional Ghost newsletter slug when list ID is not used.
   */
  ghostNewsletterSlug: string | null;
}

export interface ProgramFragment {
  __typename: "Program";
  id: number;
  /**
   * The title of the program
   */
  title: string;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
  /**
   * The first day a course lecture can possibly be in this program.
   */
  lectureStart: any | null;
  /**
   * The last day a course lecture can possibly be in this program.
   */
  lectureEnd: any | null;
  /**
   * The default application deadline for a course. It can be changed on the course level.
   */
  defaultApplicationEnd: any | null;
  /**
   * The deadline for the achievement record uploads.
   */
  achievementRecordUploadDeadline: any | null;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
  type: ProgramType_enum;
  /**
   * Default Formbricks survey URL for course enrollments/applications. Courses can override this with their own formbricksEnrollmentSurveyUrl.
   */
  defaultFormbricksEnrollmentSurveyUrl: string | null;
  /**
   * The day the application for all courses of the program start.
   */
  applicationStart: any | null;
  /**
   * An object relationship
   */
  Organization: ProgramFragment_Organization;
}
