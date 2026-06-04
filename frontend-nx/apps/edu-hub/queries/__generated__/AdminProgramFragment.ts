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
  type: string;
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
   * Default attendance-certificate template for courses in this program. Falls back to NULL when no template is configured.
   */
  attendanceCertificateTemplateId: number | null;
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
}
