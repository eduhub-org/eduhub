/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: AdminProgramFragment
// ====================================================

export interface AdminProgramFragment {
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
   * The deadline for the achievement record uploads.
   */
  achievementRecordUploadDeadline: any | null;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
  /**
   * The day the application for all courses of the program start.
   */
  applicationStart: any | null;
  /**
   * The URL to the pdf template for the attendance certificate
   */
  attendanceCertificateTemplateURL: string | null;
  /**
   * The questionnaire that the participants of all courses get sent after the last session of their course.
   */
  closingQuestionnaire: string | null;
  /**
   * The default application deadline for a course. It can be changed on the course level.
   */
  defaultApplicationEnd: any | null;
  /**
   * The default maximum number of sessions a participant can miss in a course while still receiving a certificate. It can be changed on the course level.
   */
  defaultMaxMissedSessions: number | null;
  /**
   * The URL to the pdf template for the attendance certificate
   */
  participationCertificateTemplateURL: string | null;
  /**
   * The questionnaire that is sent after all course sessions including a speaker.
   */
  speakerQuestionnaire: string | null;
  /**
   * The questionnaire that the participants of all courses get sent after the first session of their course.
   */
  startQuestionnaire: string | null;
  /**
   * Defines whether the tab for this course program is shown or not.
   */
  visibility: boolean;
  /**
   * Sets the achievement certificates for all courses of htis program to be visible for the recipients.
   */
  visibilityAchievementCertificate: boolean | null;
  /**
   * Sets the participation certificates for all courses of htis program to be visible for the recipients.
   */
  visibilityParticipationCertificate: boolean | null;
}
