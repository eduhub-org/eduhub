/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProgramType_enum, AttendanceStatus_enum, CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ProgramStatistics
// ====================================================

export interface ProgramStatistics_Program_Courses_Sessions_Attendances {
  __typename: "Attendance";
  id: number;
  /**
   * The attendance status: MISSED for a user registered for the session but not recorded (or recognized), otherwise ATTENDED
   */
  status: AttendanceStatus_enum;
  /**
   * The ID of the user for which the attendance was recorded (only provided if the recorded name was in accordance with the name of a user registered for the session)
   */
  userId: any | null;
}

export interface ProgramStatistics_Program_Courses_Sessions {
  __typename: "Session";
  id: number;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
  /**
   * An array relationship
   */
  Attendances: ProgramStatistics_Program_Courses_Sessions_Attendances[];
}

export interface ProgramStatistics_Program_Courses_CourseEnrollments {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
  /**
   * URL to the file containing the user's attendance certificate (if he obtained one)
   */
  attendanceCertificateURL: string | null;
  /**
   * URL to the file containing the user's achievement certificate (if he obtained one)
   */
  achievementCertificateURL: string | null;
  created_at: any | null;
  updated_at: any | null;
}

export interface ProgramStatistics_Program_Courses {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Decides whether the course is published for all users or not.
   */
  published: boolean;
  /**
   * An array relationship
   */
  Sessions: ProgramStatistics_Program_Courses_Sessions[];
  /**
   * An array relationship
   */
  CourseEnrollments: ProgramStatistics_Program_Courses_CourseEnrollments[];
}

export interface ProgramStatistics_Program {
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
   * Controls whether course tiles should show an extended application period banner after the program deadline has passed while individual course deadlines are still open.
   */
  showExtendedApplicationPeriodBanner: boolean;
  /**
   * The deadline for the achievement record uploads.
   */
  achievementRecordUploadDeadline: any | null;
  /**
   * Program-wide default for the project submission deadline. Used when a course does not set its own Course.projectSubmissionDeadline. Backfilled from the deprecated Program.achievementRecordUploadDeadline column, which will be dropped in Step 2.
   */
  defaultProjectSubmissionDeadline: any | null;
  /**
   * Default Project.type value applied to projects that originate in courses of this program. Students never pick the type; it is finalized by the instructor at the PROPOSED to ONGOING transition.
   */
  defaultProjectType: string | null;
  /**
   * Default value for Course.projectProposalsEnabled within this program. Controls whether course participants can propose new projects when the course also has achievementCertificatePossible enabled.
   */
  projectProposalsEnabledByDefault: boolean;
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
   * The questionnaire that the participants of all courses get sent after the last session of their course.
   */
  closingQuestionnaire: string | null;
  /**
   * The default maximum number of sessions a participant can miss in a course while still receiving a certificate. It can be changed on the course level.
   */
  defaultMaxMissedSessions: number | null;
  /**
   * The questionnaire that is sent after all course sessions including a speaker.
   */
  speakerQuestionnaire: string | null;
  /**
   * The questionnaire that the participants of all courses get sent after the first session of their course.
   */
  startQuestionnaire: string | null;
  /**
   * The URL to the pdf template for the attendance certificate
   */
  attendanceCertificateTemplateURL: string | null;
  /**
   * The URL to the pdf template for the attendance certificate
   */
  achievementCertificateTemplateURL: string | null;
  /**
   * Defines whether the tab for this course program is shown or not.
   */
  visibility: boolean;
  matrixSpaceId: string | null;
  /**
   * Matrix room id for the program-wide instructor Element chat (!room:server); invites are sent via admin API.
   */
  matrixInstructorRoomId: string | null;
  /**
   * An array relationship
   */
  Courses: ProgramStatistics_Program_Courses[];
}

export interface ProgramStatistics {
  /**
   * fetch data from the table: "Program"
   */
  Program: ProgramStatistics_Program[];
}
